import requests

from app.integrations.notifications.base import NotificationEvent, NotificationProvider
from app.schema.setting import NotifyWebhookConfig


class WebhookNotificationProvider(NotificationProvider):
    key = 'webhook'
    label = 'Webhook'

    def __init__(self, config: dict):
        super().__init__(config)
        self.settings = NotifyWebhookConfig(**config)

    def send(self, event: NotificationEvent) -> None:
        requests.post(self.settings.url, json=event.model_dump(mode='json'), timeout=10)
