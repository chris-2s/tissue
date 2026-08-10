import requests

from app.exception import BizException
from app.exception.codes import ErrorCode
from app.integrations.translators.base import TranslatorProvider
from app.integrations.translators.registry import translator_registry
from app.schema.setting import Setting


class DeepLXTranslatorProvider(TranslatorProvider):
    key = 'deeplx'
    label = 'DeepLX'

    def translate_texts(self, texts: list[str], target_language: str) -> list[str]:
        if not texts:
            return []

        url = self.config.get('url')
        if not url:
            raise BizException('DeepLX 接口地址未配置', error_code=ErrorCode.REQUEST_FAILED)

        translated_texts: list[str] = []
        for text in texts:
            response = requests.post(
                url,
                json={
                    'text': text,
                    'source_lang': 'JA',
                    'target_lang': self.normalize_target_language(target_language),
                },
                timeout=Setting().crawler.timeout,
            )
            response.raise_for_status()
            payload = response.json()
            translated_text = payload.get('data')
            if payload.get('code') != 200 or not isinstance(translated_text, str):
                raise BizException('DeepLX 返回结果格式错误', error_code=ErrorCode.REQUEST_FAILED)
            translated_texts.append(translated_text)

        return translated_texts


translator_registry.register(DeepLXTranslatorProvider)
