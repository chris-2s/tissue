from urllib.parse import urljoin

import requests

from app.i18n import translate
from app.exception import BizException
from app.exception.codes import ErrorCode
from app.integrations.translators.base import TranslatorProvider
from app.integrations.translators.registry import translator_registry
from app.schema.setting import Setting
from app.utils.logger import logger


class DeeplTranslatorProvider(TranslatorProvider):
    key = 'deepl'
    label = 'DeepL'

    def translate_texts(self, texts: list[str], target_language: str) -> list[str]:
        if not texts:
            return []
        translated_texts = self._translate_batch(texts, target_language)
        if len(translated_texts) == len(texts):
            return translated_texts

        if not translated_texts:
            raise BizException('DeepL 返回结果数量不匹配', error_code=ErrorCode.REQUEST_FAILED)

        # Some DeepLX-compatible services only return the first item for a batch request.
        # Only this prefix case is safe to recover from without risking misaligned write-back.
        if len(translated_texts) != 1:
            raise BizException('DeepL 返回结果数量不匹配', error_code=ErrorCode.REQUEST_FAILED)

        logger.warning(
            translate(
                'log.translate.deepl_batch_partial_fallback',
                {
                    'requested_count': len(texts),
                    'returned_count': len(translated_texts),
                    'language': target_language,
                },
            )
        )

        results = list(translated_texts)
        for text in texts[len(results):]:
            single_result = self._translate_batch([text], target_language)
            if len(single_result) != 1:
                raise BizException('DeepL 返回结果数量不匹配', error_code=ErrorCode.REQUEST_FAILED)
            results.extend(single_result)
        return results

    def _translate_batch(self, texts: list[str], target_language: str) -> list[str]:
        base_url = self.config.get('base_url') or 'https://api-free.deepl.com'
        api_key = self.config.get('api_key')

        data = {
            'source_lang': 'JA',
            'target_lang': self._normalize_deepl_language(target_language),
            'text': texts,
        }
        if api_key:
            data['auth_key'] = api_key

        url = self._build_url(base_url, '/v2/translate')
        response = requests.post(
            url,
            data=data,
            timeout=Setting().crawler.timeout,
        )
        response.raise_for_status()
        payload = response.json()
        translations = payload.get('translations') or []
        return [str((translations[index] or {}).get('text', text)) for index, text in enumerate(texts[:len(translations)])]

    @staticmethod
    def _build_url(base_url: str, path: str) -> str:
        normalized = base_url.rstrip('/') + '/'
        return urljoin(normalized, path.lstrip('/'))

    @staticmethod
    def _normalize_deepl_language(target_language: str) -> str:
        mapping = {
            'zh-CN': 'ZH',
            'zh-TW': 'ZH-HANT',
            'en-US': 'EN-US',
            'ja-JP': 'JA',
        }
        return mapping.get(target_language, target_language.replace('-', '_').upper())


translator_registry.register(DeeplTranslatorProvider)
