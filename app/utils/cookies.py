from dataclasses import dataclass
from typing import Any, Iterable, Sequence
from urllib.parse import quote, unquote

from requests.cookies import RequestsCookieJar


@dataclass(frozen=True)
class BrowserCookie:
    name: str
    value: str
    path: str = '/'
    domain: str = ''
    secure: bool = False
    http_only: bool = False
    same_site: str = 'Lax'


def normalize_cookie_value(value: str) -> str:
    return quote(unquote(value.strip()))


def parse_cookie_header(cookie_header: str | None) -> list[BrowserCookie]:
    if not cookie_header:
        return []

    cookies: list[BrowserCookie] = []
    for chunk in cookie_header.split(';'):
        item = chunk.strip()
        if not item or '=' not in item:
            continue

        name, value = item.split('=', 1)
        cookie_name = name.strip()
        if not cookie_name:
            continue

        cookies.append(BrowserCookie(name=cookie_name, value=normalize_cookie_value(value)))

    return cookies


def to_cookie_header(cookies: Sequence[BrowserCookie]) -> str:
    parts = [f"{cookie.name}={normalize_cookie_value(cookie.value)}" for cookie in cookies if cookie.name]
    return '; '.join(parts)


def cookie_header_to_httpx_dict(cookie_header: str | None) -> dict[str, str]:
    return to_httpx_cookie_dict(parse_cookie_header(cookie_header))


def to_httpx_cookie_dict(cookies: Iterable[BrowserCookie]) -> dict[str, str]:
    cookie_dict: dict[str, str] = {}
    for cookie in cookies:
        if cookie.name:
            cookie_dict[cookie.name] = normalize_cookie_value(cookie.value)
    return cookie_dict


def apply_cookie_header_to_jar(cookie_header: str | None, cookie_jar: RequestsCookieJar) -> None:
    apply_cookies_to_jar(parse_cookie_header(cookie_header), cookie_jar)


def apply_cookies_to_jar(cookies: Iterable[BrowserCookie], cookie_jar: RequestsCookieJar) -> None:
    for cookie in cookies:
        if cookie.name:
            cookie_jar.set(cookie.name, normalize_cookie_value(cookie.value), path=cookie.path, domain=cookie.domain)


def cookiejar_to_cookies(cookie_jar: RequestsCookieJar) -> list[BrowserCookie]:
    cookies: list[BrowserCookie] = []
    for cookie in cookie_jar:
        cookies.append(
            BrowserCookie(
                name=cookie.name,
                value=normalize_cookie_value(cookie.value),
                path=cookie.path or '/',
                domain=cookie.domain or '',
                secure=cookie.secure,
                http_only=cookie.has_nonstandard_attr('HttpOnly'),
                same_site=cookie.get_nonstandard_attr('SameSite', 'Lax'),
            )
        )
    return cookies


def cookiecloud_items_to_cookies(cookie_items: Sequence[dict[str, Any]]) -> list[BrowserCookie]:
    cookies: list[BrowserCookie] = []
    for item in cookie_items:
        name = str(item.get('name', '')).strip()
        if not name:
            continue
        value = str(item.get('value', ''))
        cookies.append(
            BrowserCookie(
                name=name,
                value=normalize_cookie_value(value),
                path=str(item.get('path') or '/'),
                domain=str(item.get('domain') or ''),
                secure=bool(item.get('secure', False)),
                http_only=bool(item.get('httpOnly', False)),
                same_site=str(item.get('sameSite') or 'Lax'),
            )
        )
    return cookies


def cookies_to_cookiecloud_items(cookies: Sequence[BrowserCookie]) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    for cookie in cookies:
        if not cookie.name:
            continue
        items.append(
            {
                'name': cookie.name,
                'value': normalize_cookie_value(cookie.value),
                'path': cookie.path or '/',
                'domain': cookie.domain or '',
                'secure': cookie.secure,
                'httpOnly': cookie.http_only,
                'sameSite': cookie.same_site or 'Lax',
            }
        )
    return items
