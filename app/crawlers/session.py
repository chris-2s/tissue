from typing import TYPE_CHECKING, Any
from urllib.parse import urlparse

from curl_cffi import requests as curl_requests  # type: ignore[import-not-found]
from curl_cffi.requests.impersonate import normalize_browser_type  # type: ignore[import-not-found]
from curl_cffi.requests.models import Headers, Response  # type: ignore[import-not-found]

from app.i18n import translate
from app.schema.setting import Setting
from app.utils.cookies import (
    apply_cookie_header_to_jar,
    apply_cookies_to_jar,
    cookiecloud_items_to_cookies,
    cookiejar_to_cookies,
    cookies_to_cookiecloud_items,
    to_cookie_header,
)
from app.utils.logger import logger

if TYPE_CHECKING:
    from app.db.models import Site


DEFAULT_IMPERSONATE = 'chrome'
DEFAULT_USER_AGENT = (
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
    'AppleWebKit/537.36 (KHTML, like Gecko) '
    'Chrome/146.0.0.0 Safari/537.36'
)


class Session(curl_requests.Session):

    def __init__(self, timeout: Any = 10, site: 'Site | None' = None, load_cookies: bool = True):
        super().__init__()
        self.timeout = timeout
        self.site = site
        self.headers = {
            'User-Agent': site.user_agent if site and site.user_agent else DEFAULT_USER_AGENT,
            'Accept-Language': 'zh-CN,zh;q=0.9',
        }
        if load_cookies and site and site.cookies:
            apply_cookie_header_to_jar(site.cookies, self.cookies)

    def request(self, method, url, **kwargs):
        cloudflare_retry = kwargs.pop('_cloudflare_retry', False)
        persist_solution = kwargs.pop('_persist_cloudflare_solution', True)
        use_flaresolverr_response = kwargs.pop('_use_flaresolverr_response', False)
        kwargs.setdefault('timeout', self.timeout)
        kwargs.setdefault('impersonate', DEFAULT_IMPERSONATE)
        response = super(Session, self).request(method, url, **kwargs)

        if (
            cloudflare_retry
            or str(method).upper() != 'GET'
            or not self.site
            or not self._is_cloudflare_challenge(response, inspect_body=not bool(kwargs.get('stream')))
        ):
            return response

        if not Setting().crawler.flaresolverr_url:
            return response

        logger.info(translate('log.cloudflare.challenge_detected', {
            'site_key': self.site.spider_key,
            'url': str(url),
        }))

        from app.crawlers.flaresolverr import solve

        response.close()
        use_flaresolverr_response = (
            use_flaresolverr_response
            and not kwargs.get('stream')
        )
        current_cookies = cookies_to_cookiecloud_items(cookiejar_to_cookies(self.cookies))
        if use_flaresolverr_response:
            (
                solved_cookies,
                user_agent,
                solved_html,
                solved_url,
                solved_status,
                solved_headers,
            ) = solve(str(url), current_cookies, return_response=True)
        else:
            solved_cookies, user_agent = solve(str(url), current_cookies)

        logger.info(translate('log.cloudflare.challenge_solved', {
            'site_key': self.site.spider_key,
            'user_agent': user_agent,
            'impersonate': DEFAULT_IMPERSONATE,
            'resolved_impersonate': normalize_browser_type(DEFAULT_IMPERSONATE),
        }))

        self.cookies.clear()
        apply_cookies_to_jar(cookiecloud_items_to_cookies(solved_cookies), self.cookies)
        self.headers['User-Agent'] = user_agent
        if persist_solution:
            self._persist_cloudflare_solution(solved_cookies, user_agent, str(url))

        retry_headers = kwargs.get('headers')
        if retry_headers and 'User-Agent' in retry_headers:
            retry_headers = dict(retry_headers)
            retry_headers['User-Agent'] = user_agent
            kwargs['headers'] = retry_headers

        if use_flaresolverr_response:
            return self._build_flaresolverr_response(
                html=solved_html,
                url=solved_url,
                status_code=solved_status,
                headers=solved_headers,
            )

        return self.request(method, url, _cloudflare_retry=True, **kwargs)

    def get(self, url, **kwargs):
        return self.request('GET', url, **kwargs)

    def head(self, url, **kwargs):
        return self.request('HEAD', url, **kwargs)

    def post(self, url, **kwargs):
        return self.request('POST', url, **kwargs)

    @staticmethod
    def _build_flaresolverr_response(
        *,
        html: str,
        url: str,
        status_code: int,
        headers: dict[str, str],
    ) -> Response:
        response = Response()
        response.url = url
        response.status_code = status_code
        response.ok = 200 <= status_code < 400
        response.content = html.encode('utf-8')
        response.response_size = len(response.content)
        response.headers = Headers({
            key: value
            for key, value in headers.items()
            if key.lower() not in {'content-encoding', 'content-length', 'transfer-encoding'}
        })
        if 'content-type' not in {key.lower() for key in response.headers}:
            response.headers['Content-Type'] = 'text/html; charset=utf-8'
        return response

    @staticmethod
    def _is_cloudflare_challenge(response, inspect_body: bool = True) -> bool:
        headers = {str(key).lower(): str(value).lower() for key, value in response.headers.items()}
        if headers.get('cf-mitigated') == 'challenge':
            return True
        if response.status_code not in {200, 403, 429, 503}:
            return False
        if 'cloudflare' not in headers.get('server', '') and 'cf-ray' not in headers:
            return False

        content_type = headers.get('content-type', '')
        if content_type and 'html' not in content_type:
            return False
        if not inspect_body:
            return response.status_code in {403, 429, 503}
        body = response.text.lower()
        return any(marker in body for marker in (
            '/cdn-cgi/challenge-platform/',
            'cf-chl-',
            'just a moment',
            'attention required',
        ))

    def _persist_cloudflare_solution(self, cookies: list[dict], user_agent: str, url: str) -> None:
        from app.db import SessionFactory
        from app.db.models import Site
        from app.service.site_cookie import SiteCookieService

        with SessionFactory() as db:
            site = db.get(Site, self.site.id)
            if not site:
                return
            site.cookies = to_cookie_header(cookiecloud_items_to_cookies(cookies)) or None
            site.user_agent = user_agent
            db.commit()

        SiteCookieService().push_cookie(cookies, urlparse(url).netloc)
