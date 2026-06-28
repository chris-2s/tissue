from app.exception import BizException
from app.integrations.notifications.base import NotificationEvent, NotificationProvider
from app.integrations.notifications.registry import notification_registry
from app.schema import CookieNotify, Setting, SubscribeNotify, VideoNotify
from app.utils.logger import logger


class NotificationManager:
    def __init__(self):
        self._provider: NotificationProvider | None = None
        self._provider_key: str | None = None
        self._provider_signature: tuple | None = None

    def refresh(self) -> None:
        self._provider = None
        self._provider_key = None
        self._provider_signature = None

    def get_active(self) -> NotificationProvider:
        setting = Setting().notify
        provider_key = setting.provider
        provider_cls = notification_registry.get(provider_key)
        if provider_cls is None:
            raise BizException(f'不支持的通知渠道: {provider_key}')

        provider_config = setting.get_provider_payload(provider_key)
        signature = tuple(sorted(provider_config.items()))
        if self._provider is None or self._provider_key != provider_key or self._provider_signature != signature:
            self._provider = provider_cls(provider_config)
            self._provider_key = provider_key
            self._provider_signature = signature
        return self._provider

    def emit(self, event: NotificationEvent) -> None:
        try:
            self.get_active().send(event)
        except Exception as exc:
            logger.warning(f"发送通知失败: {exc}")

    def send_video(self, video: VideoNotify) -> None:
        self.emit(NotificationEvent(
            event='video.saved' if video.is_success else 'video.failed',
            payload=video.model_dump(),
        ))

    def send_subscribe(self, subscribe: SubscribeNotify) -> None:
        self.emit(NotificationEvent(
            event='subscribe.started',
            payload=subscribe.model_dump(),
        ))

    def send_cookie(self, cookie: CookieNotify) -> None:
        self.emit(NotificationEvent(
            event='cookie.invalid',
            payload=cookie.model_dump(),
        ))


notification_manager = NotificationManager()

