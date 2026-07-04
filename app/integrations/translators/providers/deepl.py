from urllib.parse import urljoin

import requests

from app.exception import BizException
from app.exception.codes import ErrorCode
from app.integrations.translators.base import TranslatorProvider
from app.integrations.translators.registry import translator_registry
from app.schema.setting import Setting


class DeeplTranslatorProvider(TranslatorProvider):
    key = 'deepl'
    label = 'DeepL'

    def translate_texts(self, texts: list[str], target_language: str) -> list[str]:
        if not texts:
            return []
        base_url = self.config.get('base_url') or 'https://api-free.deepl.com'
        api_key = self.config.get('api_key')
        if not api_key:
            raise BizException('未配置 DeepL API Key', error_code=ErrorCode.REQUEST_FAILED)

        url = self._build_url(base_url, '/v2/translate')
        response = requests.post(
            url,
            data={
                'auth_key': api_key,
                'target_lang': self._normalize_deepl_language(target_language),
                'text': texts,
            },
            timeout=Setting().crawler.timeout,
        )
        response.raise_for_status()
        payload = response.json()
        translations = payload.get('translations') or []
        if len(translations) != len(texts):
            raise BizException('DeepL 返回结果数量不匹配', error_code=ErrorCode.REQUEST_FAILED)
        return [str((translations[index] or {}).get('text', text)) for index, text in enumerate(texts)]

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
