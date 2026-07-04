from abc import ABC, abstractmethod
from typing import Any

class LlmProvider(ABC):
    key: str
    label: str

    def __init__(self, config: dict[str, Any]):
        self.config = config

    @abstractmethod
    def translate_metadata_fields(
        self,
        payload: dict[str, object],
        target_language: str,
    ) -> dict[str, object]:
        pass

    @abstractmethod
    def translate_actor_names(self, names: list[str], target_language: str) -> list[str]:
        pass
