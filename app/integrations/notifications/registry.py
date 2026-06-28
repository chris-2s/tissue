from app.integrations.notifications.base import NotificationProvider
from app.integrations.notifications.providers.telegram import TelegramNotificationProvider
from app.integrations.notifications.providers.webhook import WebhookNotificationProvider


class NotificationRegistry:
    def __init__(self):
        self._providers: dict[str, type[NotificationProvider]] = {}

    def register(self, provider_cls: type[NotificationProvider]) -> None:
        self._providers[provider_cls.key] = provider_cls

    def get(self, key: str) -> type[NotificationProvider] | None:
        return self._providers.get(key)

    def keys(self) -> list[str]:
        return list(self._providers.keys())


notification_registry = NotificationRegistry()
notification_registry.register(TelegramNotificationProvider)
notification_registry.register(WebhookNotificationProvider)

