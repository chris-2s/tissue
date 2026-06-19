from app.schema import VideoNotify, Setting, SubscribeNotify, CookieNotify
from app.utils.logger import logger
from app.utils.notify.base import Base
from app.utils.notify.telegram import Telegram
from app.utils.notify.webhook import Webhook


def match_notification() -> Base:
    setting = Setting().notify

    match setting.type:
        case 'telegram':
            return Telegram(setting)
        case 'webhook':
            return Webhook(setting)


def send_video(video: VideoNotify):
    try:
        notification = match_notification()
        notification.send_video(video)
    except Exception as e:
        logger.warning(f"发送视频通知失败: {e}")


def send_subscribe(subscribe: SubscribeNotify):
    try:
        notification = match_notification()
        notification.send_subscribe(subscribe)
    except Exception as e:
        logger.warning(f"发送订阅通知失败: {e}")


def send_cookie(cookie: CookieNotify):
    try:
        notification = match_notification()
        notification.send_cookie(cookie)
    except Exception as e:
        logger.warning(f"发送 Cookie 通知失败: {e}")
