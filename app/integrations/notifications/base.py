from abc import ABC, abstractmethod
from typing import Any

from pydantic import BaseModel, Field


class NotificationEvent(BaseModel):
    event: str
    payload: dict[str, Any]
    attachments: dict[str, Any] = Field(default_factory=dict)


class NotificationProvider(ABC):
    key: str
    label: str

    def __init__(self, config: dict[str, Any]):
        self.config = config

    @abstractmethod
    def send(self, event: NotificationEvent) -> None:
        pass

