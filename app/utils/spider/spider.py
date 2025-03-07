from abc import abstractmethod

import requests

from app.schema import Setting


class Session(requests.Session):

    def __init__(self, timeout: int = 10):
        super().__init__()
        self.timeout = timeout

    def request(self, *args, **kwargs):
        kwargs.setdefault('timeout', self.timeout)
        return super(Session, self).request(*args, **kwargs)


class Spider:
    name = None
    host = None
    downloadable = False

    def __init__(self):
        self.setting = Setting().app
        self.session = Session()
        self.session.headers = {'User-Agent': self.setting.user_agent, 'Referer': self.host}
        self.session.timeout = (5, self.session.timeout)

    @abstractmethod
    def get_info(self, num: str, url: str = None, include_downloads: bool = False):
        pass

    @classmethod
    def get_cover(cls, url):
        response = requests.get(url, headers={'Referer': cls.host})
        if response.ok:
            return response.content
