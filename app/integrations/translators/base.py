from abc import ABC, abstractmethod
from typing import Any

class TranslatorProvider(ABC):
    key: str
    label: str

    def __init__(self, config: dict[str, Any]):
        self.config = config

    @abstractmethod
    def translate_texts(self, texts: list[str], target_language: str) -> list[str]:
        pass
