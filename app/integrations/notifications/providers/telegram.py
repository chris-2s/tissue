import os

import requests

from app.i18n import translate
from app.integrations.notifications.base import NotificationEvent, NotificationProvider
from app.schema.notification import CookieInvalidPayload, SubscribeStartedPayload, VideoFailedPayload, VideoSavedPayload
from app.schema.setting import NotifyTelegramConfig
from app.service.resource import ResourceService


class TelegramNotificationProvider(NotificationProvider):
    key = 'telegram'
    label = 'Telegram'

    def __init__(self, config: dict):
        super().__init__(config)
        self.settings = NotifyTelegramConfig(**config)

    def send(self, event: NotificationEvent) -> None:
        match event.event:
            case 'video.saved':
                self._send_video_saved(VideoSavedPayload.model_validate(event.payload))
            case 'video.failed':
                self._send_video_failed(VideoFailedPayload.model_validate(event.payload))
            case 'subscribe.started':
                self._send_subscribe_started(SubscribeStartedPayload.model_validate(event.payload))
            case 'cookie.invalid':
                self._send_cookie_invalid(CookieInvalidPayload.model_validate(event.payload))

    def _send_video_saved(self, video: VideoSavedPayload):
        actors = ', '.join(map(lambda item: item.name, video.actors))
        tags = []
        if video.is_zh:
            tags.append(translate('notify.tag.zh'))
        if video.is_uncensored:
            tags.append(translate('notify.tag.uncensored'))
        content = self._build_message(
            title_key='notify.video.saved.title',
            body_key='notify.video.saved.body',
            params={
                'num': video.num or '-',
                'actors': actors or '-',
                'size': video.size or '-',
                'path': video.path or '-',
                'tags': ', '.join(tags) if tags else '-',
            },
        )

        picture = None
        picture_name = None
        if video.cover:
            picture = ResourceService.fetch_image_bytes(video.cover, 'cover')
            _, ext_name = os.path.splitext(video.cover)
            picture_name = f'cover{ext_name}'
        self._send_message(content, picture=picture, picture_name=picture_name)

    def _send_video_failed(self, video: VideoFailedPayload):
        content = self._build_message(
            title_key='notify.video.failed.title',
            body_key='notify.video.failed.body',
            params={
                'path': video.path or '-',
                'size': video.size or '-',
                'message': video.message or '-',
            },
        )

        picture = None
        picture_name = None
        if video.cover:
            picture = ResourceService.fetch_image_bytes(video.cover, 'cover')
            _, ext_name = os.path.splitext(video.cover)
            picture_name = f'cover{ext_name}'
        self._send_message(content, picture=picture, picture_name=picture_name)

    def _send_subscribe_started(self, subscribe: SubscribeStartedPayload):
        tags = []
        if subscribe.is_hd:
            tags.append(translate('notify.tag.hd'))
        if subscribe.is_zh:
            tags.append(translate('notify.tag.zh'))
        if subscribe.is_uncensored:
            tags.append(translate('notify.tag.uncensored'))

        link_text = (
            f"<a href='{subscribe.url}'>{translate('notify.action.click')}</a>"
            if subscribe.url else '-'
        )
        content = self._build_message(
            title_key='notify.subscribe.started.title',
            body_key='notify.subscribe.started.body',
            params={
                'num': subscribe.num,
                'actors': subscribe.actors or '-',
                'size': subscribe.size or '-',
                'name': subscribe.name or '-',
                'site': subscribe.source.site_name if subscribe.source else '-',
                'link': link_text,
                'publish_date': subscribe.publish_date or '-',
                'tags': ', '.join(tags) if tags else '-',
            },
        )

        picture = None
        picture_name = None
        if subscribe.cover:
            picture = ResourceService.fetch_image_bytes(subscribe.cover, 'cover')
            _, ext_name = os.path.splitext(subscribe.cover)
            picture_name = f'cover{ext_name}'
        self._send_message(content, picture=picture, picture_name=picture_name)

    def _send_cookie_invalid(self, cookie: CookieInvalidPayload):
        content = self._build_message(
            title_key='notify.cookie.invalid.title',
            body_key='notify.cookie.invalid.body',
            params={
                'site_name': cookie.site_name,
                'domain': cookie.domain,
                'message': cookie.message,
            },
        )
        self._send_message(content)

    @staticmethod
    def _build_message(title_key: str, body_key: str, params: dict[str, object]) -> str:
        title = translate(title_key, params)
        body = translate(body_key, params)
        return f"\n<b>{title}</b>\n{body}\n"

    def _send_message(self, content: str, picture: bytes | None = None, picture_name: str | None = None):
        token = self.settings.token
        chat_id = self.settings.chat_id

        if picture:
            url = f'https://api.telegram.org/bot{token}/sendPhoto'
            requests.post(url=url, data={
                'chat_id': chat_id,
                'parse_mode': 'HTML',
                'caption': content,
                'has_spoiler': True,
            }, files={
                'photo': (picture_name, picture),
            }, timeout=10)
        else:
            url = f'https://api.telegram.org/bot{token}/sendMessage'
            requests.post(url=url, data={
                'chat_id': chat_id,
                'parse_mode': 'HTML',
                'text': content,
            }, timeout=10)
