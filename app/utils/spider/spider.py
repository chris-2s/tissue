from abc import abstractmethod
from urllib.parse import unquote, quote
from typing import Any
import base64

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

    def __init__(self, alternate_host: str | None = None, cookies: str | None = None):
        self.host = alternate_host or self.origin_host

        self.setting = Setting().app
        self.session = Session()
        self.session.headers = {'User-Agent': self.setting.user_agent, 'Referer': self.host}
        self.session.timeout = (5, self.session.timeout)

        if cookies:
            self._load_cookies(cookies)
            self._ensure_valid_cookies()

    def _ensure_valid_cookies(self):
        """使用 HEAD 请求检测 cookie 是否有效"""
        if not self.session.cookies:
            return

        try:
            head_response = self.session.head(self.host, timeout=3, allow_redirects=True)
            if not head_response.ok:
                self.session.cookies.clear()
        except:
            self.session.cookies.clear()

    def _load_cookies(self, cookies_str: str):
        """从浏览器复制的 cookie 字符串加载
        格式: key1=value1; key2=value2
        """
        for cookie in cookies_str.split(';'):
            cookie = cookie.strip()
            if not cookie or '=' not in cookie:
                continue
            name, value = cookie.split('=', 1)
            name = name.strip()
            value = value.strip()
            value = quote(unquote(value))
            self.session.cookies.set(name, value)

    def get_login_page(self) -> dict[str, Any]:
        """获取登录页信息，返回 cookies + authenticity_token + captcha"""
        raise NotImplementedError

    def submit_login(self, cookies: str, authenticity_token: str, 
                    username: str, password: str, captcha: str) -> list[dict]:
        """提交登录，返回登录后的 cookie 数组"""
        raise NotImplementedError

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
