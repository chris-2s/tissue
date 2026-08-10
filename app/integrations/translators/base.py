from abc import ABC, abstractmethod
from typing import Any


class TranslatorProvider(ABC):
    key: str
    label: str

    def __init__(self, config: dict[str, Any]):
        self.config = config

    @staticmethod
    def normalize_target_language(target_language: str) -> str:
        mapping = {
            'zh-CN': 'ZH',
            'zh-TW': 'ZH-HANT',
            'en-US': 'EN-US',
            'ja-JP': 'JA',
        }
        return mapping.get(target_language, target_language.replace('-', '_').upper())

    @abstractmethod
    def translate_texts(self, texts: list[str], target_language: str) -> list[str]:
        pass
