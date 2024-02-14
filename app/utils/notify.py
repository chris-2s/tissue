import os.path

import requests

from app.schema import Setting, VideoNotify
from app.utils import cache


def send_video(video: VideoNotify):
    setting = Setting().notify
    try:
        match setting.type:
            case 'telegram':
                if setting.telegram_token and setting.telegram_chat_id:
                    send_telegram(video, setting.telegram_token, setting.telegram_chat_id)
            case 'webhook':
                if setting.webhook_url:
                    send_webhook(video, setting.webhook_url)
    except:
        pass


def send_telegram(video: VideoNotify, token: str, chat_id: str):
    actors = ', '.join(map(lambda i: i.name, video.actors))
    tags = []
    if video.is_zh: tags.append('中文')
    if video.is_uncensored: tags.append('无码')
    tags = ', '.join(tags)

    if video.is_success:
        content = f'''
<b><tg-spoiler>{video.num}</tg-spoiler>整理成功</b>
演员：<tg-spoiler>{actors}</tg-spoiler>
大小：{video.size}
文件：<tg-spoiler>{video.path}</tg-spoiler>
标签：<tg-spoiler>{tags}</tg-spoiler>
        '''
    else:
        content = f'''
<b>影片整理失败</b>
文件：<tg-spoiler>{video.path}</tg-spoiler>
大小：{video.size}
消息: <tg-spoiler>{video.message}</tg-spoiler>
        '''

    if video.cover:
        url = f'https://api.telegram.org/bot{token}/sendPhoto'
        _, ext_name = os.path.splitext(video.cover)
        requests.post(url=url, data={
            'chat_id': chat_id,
            'parse_mode': 'HTML',
            'caption': content,
            'has_spoiler': True
        }, files={
            'photo': ('cover' + ext_name, cache.get_cache_file('cover', video.cover))
        })
    else:
        url = f'https://api.telegram.org/bot{token}/sendMessage'
        requests.post(url=url, data={
            'chat_id': chat_id,
            'parse_mode': 'HTML',
            'text': content,
        })


def send_webhook(video: VideoNotify, url: str):
    requests.post(url, json=video.model_dump_json())
