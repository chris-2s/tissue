from abc import abstractmethod

import requests
import urllib3.util

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
    origin_host = None
    downloadable = False

    def __init__(self, alternate_host: str | None = None):
        self.host = alternate_host or self.origin_host

        self.setting = Setting().app
        self.session = Session()
        self.session.headers = {'User-Agent': self.setting.user_agent, 'Referer': self.host}
        self.session.timeout = (5, self.session.timeout)

    @abstractmethod
    def get_info(self, num: str, url: str = None, include_downloads: bool = False, include_previews: bool = False,
                 include_comments=False):
        pass

    @classmethod
    def get_cover(cls, url):
        if cls.origin_host:
            referer = cls.origin_host
        else:
            uri = urllib3.util.parse_url(url)
            referer = f'{uri.scheme}://{uri.host}/'
        response = requests.get(url, headers={'Referer': referer}, timeout=10)
        if response.ok:
            return response.content
        return None

    def testing(self) -> bool:
        try:
            response = self.session.get(self.origin_host)
            return response.ok
        except Exception as e:
            return False
