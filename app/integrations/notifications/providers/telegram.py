import os

import requests

from app.integrations.notifications.base import NotificationEvent, NotificationProvider
from app.schema import SubscribeNotify, VideoNotify, CookieNotify
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
            case 'video.saved' | 'video.failed':
                self._send_video(VideoNotify.model_validate(event.payload))
            case 'subscribe.started':
                self._send_subscribe(SubscribeNotify.model_validate(event.payload))
            case 'cookie.invalid':
                self._send_cookie(CookieNotify.model_validate(event.payload))

    def _send_video(self, video: VideoNotify):
        if video.is_success:
            actors = ', '.join(map(lambda item: item.name, video.actors))
            tags = []
            if video.is_zh:
                tags.append('中文')
            if video.is_uncensored:
                tags.append('无码')
            content = f'''
<b><tg-spoiler>{video.num}</tg-spoiler>整理成功</b>
演员：<tg-spoiler>{actors}</tg-spoiler>
大小：{video.size}
文件：<tg-spoiler>{video.path}</tg-spoiler>
标签：<tg-spoiler>{', '.join(tags)}</tg-spoiler>
'''
        else:
            content = f'''
<b>影片整理失败</b>
文件：<tg-spoiler>{video.path}</tg-spoiler>
大小：{video.size}
消息: <tg-spoiler>{video.message}</tg-spoiler>
'''

        picture = None
        picture_name = None
        if video.cover:
            picture = ResourceService.fetch_image_bytes(video.cover, 'cover')
            _, ext_name = os.path.splitext(video.cover)
            picture_name = f'cover{ext_name}'
        self._send_message(content, picture=picture, picture_name=picture_name)

    def _send_subscribe(self, subscribe: SubscribeNotify):
        tags = []
        if subscribe.is_hd:
            tags.append('高清')
        if subscribe.is_zh:
            tags.append('中文')
        if subscribe.is_uncensored:
            tags.append('无码')

        content = f'''
<b><tg-spoiler>{subscribe.num}</tg-spoiler>开始下载</b>
演员：<tg-spoiler>{subscribe.actors}</tg-spoiler>
大小：{subscribe.size}
名称：<tg-spoiler>{subscribe.name}</tg-spoiler>
站点：<tg-spoiler>{subscribe.source.site_name if subscribe.source else ''}</tg-spoiler>
链接：<a href='{subscribe.url}'>点击</a>
日期：{subscribe.publish_date}
标签：<tg-spoiler>{', '.join(tags)}</tg-spoiler>
'''

        picture = None
        picture_name = None
        if subscribe.cover:
            picture = ResourceService.fetch_image_bytes(subscribe.cover, 'cover')
            _, ext_name = os.path.splitext(subscribe.cover)
            picture_name = f'cover{ext_name}'
        self._send_message(content, picture=picture, picture_name=picture_name)

    def _send_cookie(self, cookie: CookieNotify):
        content = f'''
<b>⚠️ 站点Cookie失效</b>
站点：<tg-spoiler>{cookie.site_name}</tg-spoiler>
域名：<tg-spoiler>{cookie.domain}</tg-spoiler>
原因：<tg-spoiler>{cookie.message}</tg-spoiler>
'''
        self._send_message(content)

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
