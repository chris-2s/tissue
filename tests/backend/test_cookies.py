from types import SimpleNamespace

from app.utils.cookies import (
    BrowserCookie,
    apply_cookie_header_to_jar,
    cookiecloud_items_to_cookies,
    cookies_to_cookiecloud_items,
    is_same_domain_or_subdomain,
    normalize_host,
    parse_cookie_header,
    to_cookie_header,
)


class FakeCookieJar:
    def __init__(self):
        self.items = []

    def set(self, name, value, path="/", domain=""):
        self.items.append(
            {
                "name": name,
                "value": value,
                "path": path,
                "domain": domain,
            }
        )


def test_parse_cookie_header_ignores_invalid_chunks():
    cookies = parse_cookie_header("foo=bar; invalid; =skip; token=a%2Fb")

    assert cookies == [
        BrowserCookie(name="foo", value="bar"),
        BrowserCookie(name="token", value="a/b"),
    ]


def test_to_cookie_header_normalizes_values():
    header = to_cookie_header(
        [
            BrowserCookie(name="foo", value="bar baz"),
            BrowserCookie(name="token", value="a/b"),
        ]
    )

    assert header == "foo=bar%20baz; token=a/b"


def test_apply_cookie_header_to_jar_sets_each_cookie():
    jar = FakeCookieJar()

    apply_cookie_header_to_jar("foo=bar; token=a%2Fb", jar)

    assert jar.items == [
        {"name": "foo", "value": "bar", "path": "/", "domain": ""},
        {"name": "token", "value": "a/b", "path": "/", "domain": ""},
    ]


def test_cookiecloud_items_conversion_preserves_metadata():
    cookies = cookiecloud_items_to_cookies(
        [
            {
                "name": "session",
                "value": "abc 123",
                "path": "/",
                "domain": "example.com",
                "secure": True,
                "httpOnly": True,
                "sameSite": "Strict",
            }
        ]
    )

    assert cookies_to_cookiecloud_items(cookies) == [
        {
            "name": "session",
            "value": "abc%20123",
            "path": "/",
            "domain": "example.com",
            "secure": True,
            "httpOnly": True,
            "sameSite": "Strict",
        }
    ]


def test_normalize_host_extracts_hostname_from_url():
    assert normalize_host("https://WWW.Example.com:8443/path") == "www.example.com"


def test_is_same_domain_or_subdomain_requires_dot_boundary():
    assert is_same_domain_or_subdomain("www.javdb.com", "javdb.com") is True
    assert is_same_domain_or_subdomain("javdb.com", "www.javdb.com") is True
    assert is_same_domain_or_subdomain("eviljavdb.com", "javdb.com") is False
