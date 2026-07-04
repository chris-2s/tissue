from abc import ABC, abstractmethod
from typing import Any

from app.schema.actor import Actor
from app.schema.setting import ActorNameDisplay
from app.schema.video import VideoDetail


class LlmProvider(ABC):
    key: str
    label: str

    def __init__(self, config: dict[str, Any]):
        self.config = config

    @abstractmethod
    def translate_metadata(self, video: VideoDetail, target_language: str) -> VideoDetail:
        pass

    @abstractmethod
    def translate_actors(
        self,
        actors: list[Actor],
        target_language: str,
        display_mode: ActorNameDisplay,
    ) -> list[Actor]:
        pass
