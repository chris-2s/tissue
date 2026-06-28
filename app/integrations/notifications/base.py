from abc import ABC, abstractmethod
from datetime import UTC, datetime
from typing import Any

from pydantic import BaseModel, Field


class NotificationEvent(BaseModel):
    event: str
    version: int = 1
    timestamp: datetime = Field(default_factory=lambda: datetime.now(UTC))
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
