from app.schema import VideoNotify, Setting, SubscribeNotify
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
    except:
        pass


def send_subscribe(subscribe: SubscribeNotify):
    try:
        notification = match_notification()
        notification.send_subscribe(subscribe)
    except:
        pass
