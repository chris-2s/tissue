import requests

from app.schema import VideoNotify, SubscribeNotify
from app.utils.notify.base import Base


class Webhook(Base):

    def send_video(self, video: VideoNotify):
        self.send('video', video.model_dump())

    def send_subscribe(self, subscribe: SubscribeNotify):
        pass

    def send(self, event: str, payload: dict):
        requests.post(self.setting.webhook_url, json={
            event: event,
            payload: payload
        }, timeout=10)
