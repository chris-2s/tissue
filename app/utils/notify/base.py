from app.schema import VideoNotify, SettingNotify, SubscribeNotify


class Base:

    def __init__(self, setting: SettingNotify):
        self.setting = setting

    def send_video(self, video: VideoNotify):
        pass

    def send_subscribe(self, subscribe: SubscribeNotify):
        pass
