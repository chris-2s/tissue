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
            raise BizException('DeepL API Key 未配置', error_code=ErrorCode.REQUEST_FAILED)

        payload = {
            'source_lang': 'JA',
            'target_lang': self.normalize_target_language(target_language),
            'text': texts,
        }
        headers = {
            'Authorization': f'DeepL-Auth-Key {api_key}',
            'Content-Type': 'application/json',
        }

        url = self._build_url(base_url, '/v2/translate')
        response = requests.post(
            url,
            headers=headers,
            json=payload,
            timeout=Setting().crawler.timeout,
        )
        response.raise_for_status()
        translations = response.json().get('translations') or []
        if len(translations) != len(texts) or any(
            not isinstance(translation, dict) or not isinstance(translation.get('text'), str)
            for translation in translations
        ):
            raise BizException('DeepL 返回结果数量不匹配', error_code=ErrorCode.REQUEST_FAILED)
        return [translation['text'] for translation in translations]

    @staticmethod
    def _build_url(base_url: str, path: str) -> str:
        normalized = base_url.rstrip('/') + '/'
        return urljoin(normalized, path.lstrip('/'))


translator_registry.register(DeeplTranslatorProvider)
