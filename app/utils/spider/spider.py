import base64
from abc import abstractmethod
from typing import Any

import urllib3.util
from curl_cffi import requests as curl_requests  # type: ignore[import-not-found]
from PIL import Image, ImageFile

from app.schema.setting import Setting
from app.schema.home import SiteVideo
from app.schema.video import SourceRef
from app.utils.cookies import apply_cookie_header_to_jar


DEFAULT_IMPERSONATE = 'chrome124'
IMAGE_PROBE_RANGE_BYTES = 64 * 1024
IMAGE_PROBE_MAX_BYTES = 256 * 1024
DEFAULT_USER_AGENT = (
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
    'AppleWebKit/537.36 (KHTML, like Gecko) '
    'Chrome/124.0.0.0 Safari/537.36'
)


class Session(curl_requests.Session):

    def __init__(self, timeout: Any = 10):
        super().__init__()
        self.timeout = timeout

    def request(self, *args, **kwargs):
        kwargs.setdefault('timeout', self.timeout)
        kwargs.setdefault('impersonate', DEFAULT_IMPERSONATE)
        return super(Session, self).request(*args, **kwargs)


class Spider:
    key = None
    name = None
    origin_host = None
    downloadable = False
    supports_ranking = False
    supports_actor = False
    supports_login = False
    supports_downloads = False
    supports_previews = False
    supports_comments = False

    @staticmethod
    def _get_timeout_seconds() -> int:
        try:
            timeout = int(Setting().app.timeout)
            return timeout if timeout > 0 else 10
        except Exception:
            return 10

    def __init__(self, alternate_host: str | None = None, cookies: str | None = None, site_id: int | None = None):
        self.host = alternate_host or self.origin_host
        self.site_id = site_id
        timeout_seconds = self._get_timeout_seconds()

        self.session = Session()
        self.session.headers = {'User-Agent': DEFAULT_USER_AGENT, 'Referer': self.host}
        self.session.timeout = (10, timeout_seconds)

        if cookies:
            self._load_cookies(cookies)
            self._ensure_valid_cookies()

    def source_ref(self) -> SourceRef:
        if self.site_id is None or self.key is None or self.name is None:
            raise ValueError('Spider source fields are incomplete')
        return SourceRef(site_id=self.site_id, spider_key=self.key, site_name=self.name)

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
        apply_cookie_header_to_jar(cookies_str, self.session.cookies)

    def probe_image_info(self, url: str) -> dict[str, Any] | None:
        if not url:
            return None

        response = None
        try:
            headers = dict(self.session.headers)
            headers['Range'] = f'bytes=0-{IMAGE_PROBE_RANGE_BYTES - 1}'
            response = self.session.get(url, headers=headers, stream=True, allow_redirects=True)
            if not response.ok:
                return None

            parser = ImageFile.Parser()
            read_size = 0
            content_type = response.headers.get('content-type')
            mime = content_type.split(';', 1)[0].strip() if content_type else None

            for chunk in response.iter_content(chunk_size=8192):
                if not chunk:
                    continue
                read_size += len(chunk)
                if read_size > IMAGE_PROBE_MAX_BYTES:
                    break

                parser.feed(chunk)
                if parser.image:
                    width, height = parser.image.size
                    image_format = parser.image.format
                    return {
                        'width': width,
                        'height': height,
                        'mime': mime or Image.MIME.get(image_format),
                    }

            image = parser.close()
            width, height = image.size
            return {
                'width': width,
                'height': height,
                'mime': mime or Image.MIME.get(image.format),
            }
        except Exception:
            return None
        finally:
            if response is not None:
                response.close()

    def get_login_page(self) -> dict[str, Any]:
        """获取登录页信息，返回 cookies + authenticity_token + captcha"""
        raise NotImplementedError

    def submit_login(self, cookies: str, authenticity_token: str, 
                    username: str, password: str, captcha: str) -> list[dict]:
        """提交登录，返回登录后的 cookie 数组"""
        raise NotImplementedError

    @abstractmethod
    def get_info(self, num: str, url: str | None = None, include_downloads: bool = False,
                 include_previews: bool = False,
                 include_comments=False):
        pass

    def search_actor(self, name: str):
        raise NotImplementedError

    def search_video(self, num: str) -> list[SiteVideo]:
        return []

    @classmethod
    def get_cover(cls, url: str):
        referer: str
        if cls.origin_host is not None:
            referer = cls.origin_host
        else:
            uri = urllib3.util.parse_url(url)
            scheme = uri.scheme or 'https'
            referer = f'{scheme}://{uri.host}/' if uri.host else url
        response = curl_requests.get(
            url,
            headers={'Referer': referer},
            timeout=cls._get_timeout_seconds(),
            impersonate=DEFAULT_IMPERSONATE,
        )
        if response.ok:
            return response.content
        return None

    def testing(self) -> bool:
        try:
            response = self.session.get(self.origin_host)
            return response.ok
        except Exception as e:
            return False
