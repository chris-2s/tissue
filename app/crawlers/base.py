import base64
from abc import abstractmethod
from typing import Any

import urllib3.util
from curl_cffi import requests as curl_requests  # type: ignore[import-not-found]
from PIL import Image, ImageFile

from app.crawlers.session import DEFAULT_IMPERSONATE, DEFAULT_USER_AGENT, Session
from app.db.models import Site
from app.schema.setting import Setting
from app.schema.home import SiteVideo
from app.schema.actor import ActorPage
from app.schema.video import SourceRef
from app.utils.cookies import (
    cookies_to_cookiecloud_items,
    parse_cookie_header,
)


IMAGE_PROBE_RANGE_BYTES = 64 * 1024
IMAGE_PROBE_MAX_BYTES = 256 * 1024


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
    supported_languages = ('ja-JP',)

    @staticmethod
    def _get_timeout_seconds() -> int:
        try:
            timeout = int(Setting().crawler.timeout)
            return timeout if timeout > 0 else 10
        except Exception:
            return 10

    def __init__(self, site: Site | None = None, load_cookies: bool = True):
        self.host = site.alternate_host if site and site.alternate_host else self.origin_host
        self.site_id = site.id if site else None
        self.language = (getattr(site, 'language', None) if site else None) or self.supported_languages[0]
        timeout_seconds = self._get_timeout_seconds()

        self.session = Session(site=site, load_cookies=load_cookies)
        self.session.headers['Referer'] = self.host
        self.session.timeout = (10, timeout_seconds)

        if self.session.cookies:
            self._ensure_valid_cookies()

    def close(self):
        self.session.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()

    def source_ref(self) -> SourceRef:
        if self.site_id is None or self.key is None or self.name is None:
            raise ValueError('Spider source fields are incomplete')
        return SourceRef(site_id=self.site_id, spider_key=self.key, site_name=self.name)

    def _ensure_valid_cookies(self):
        """让站点有机会重置当前会话，不在这里判断 cookie 是否失效"""
        if not self.session.cookies:
            return

        try:
            response = self.session.head(self.host, timeout=3, allow_redirects=True)
            response.close()
        except Exception:
            pass

    def check_cookie_validity(self, cookie_header: str | None) -> tuple[list[dict], str] | None:
        cookies = cookies_to_cookiecloud_items(parse_cookie_header(cookie_header))
        return cookies, str(self.session.headers.get('User-Agent') or DEFAULT_USER_AGENT)

    def probe_image_info(self, url: str) -> dict[str, Any] | None:
        if not url:
            return None

        response = None
        try:
            headers = {
                'Range': f'bytes=0-{IMAGE_PROBE_RANGE_BYTES - 1}',
            }
            if self.host:
                headers['Referer'] = self.host
            response = curl_requests.get(
                url,
                headers=headers,
                timeout=self.session.timeout,
                stream=True,
                allow_redirects=True,
                impersonate=DEFAULT_IMPERSONATE,
            )
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

    def get_actor_page(self, code: str, page: int) -> ActorPage:
        raise NotImplementedError

    def search_video(self, num: str) -> list[SiteVideo]:
        return []

    @classmethod
    def fetch_cover(cls, url: str) -> tuple[int | None, bytes | None, str | None]:
        referer: str
        if cls.origin_host is not None:
            referer = cls.origin_host
        else:
            uri = urllib3.util.parse_url(url)
            scheme = uri.scheme or 'https'
            referer = f'{scheme}://{uri.host}/' if uri.host else url
        response = None
        try:
            response = curl_requests.get(
                url,
                headers={'Referer': referer},
                timeout=cls._get_timeout_seconds(),
                impersonate=DEFAULT_IMPERSONATE,
            )
            if response.ok:
                content_type = response.headers.get('content-type')
                if content_type:
                    content_type = content_type.split(';', 1)[0].strip()
                return response.status_code, response.content, content_type
            return response.status_code, None, None
        except Exception:
            return None, None, None
        finally:
            if response is not None:
                response.close()

    def testing(self) -> bool:
        try:
            response = self.session.get(self.host)
            return response.ok
        except Exception:
            return False
