from types import SimpleNamespace

from app.crawlers.base import DEFAULT_IMPERSONATE, IMAGE_PROBE_RANGE_BYTES, Spider
from app.crawlers.session import Session
from app.crawlers.flaresolverr import _api_url, solve


class FakeResponse:
    def __init__(self, payload=None, *, status_code=200, headers=None, text='', url='https://example.com/'):
        self.payload = payload
        self.status_code = status_code
        self.headers = headers or {}
        self.text = text
        self.url = url
        self.ok = status_code < 400
        self.closed = False

    def raise_for_status(self):
        return None

    def json(self):
        return self.payload

    def close(self):
        self.closed = True


def test_api_url_appends_v1_only_when_needed():
    assert _api_url('http://flaresolverr:8191') == 'http://flaresolverr:8191/v1'
    assert _api_url('http://flaresolverr:8191/v1/') == 'http://flaresolverr:8191/v1'


def test_solve_uses_shared_session_and_name_value_cookies(monkeypatch):
    captured = {}
    setting = SimpleNamespace(crawler=SimpleNamespace(
        flaresolverr_url='http://flaresolverr:8191',
        timeout=60,
    ))
    monkeypatch.setattr('app.crawlers.flaresolverr.Setting', lambda: setting)

    def fake_post(url, json, timeout):
        captured.update(url=url, json=json, timeout=timeout)
        return FakeResponse({
            'status': 'ok',
            'solution': {
                'cookies': [{'name': 'cf_clearance', 'value': 'solved', 'domain': '.example.com'}],
                'userAgent': 'Solved UA',
            },
        })

    monkeypatch.setattr('app.crawlers.flaresolverr.requests.post', fake_post)

    cookies, user_agent = solve(
        'https://example.com/protected',
        [{'name': 'login', 'value': 'token', 'domain': '.example.com', 'path': '/'}],
    )

    assert cookies[0]['name'] == 'cf_clearance'
    assert user_agent == 'Solved UA'
    assert captured == {
        'url': 'http://flaresolverr:8191/v1',
        'json': {
            'cmd': 'request.get',
            'url': 'https://example.com/protected',
            'session': 'tissue-default',
            'cookies': [{'name': 'login', 'value': 'token'}],
            'maxTimeout': 60000,
            'returnOnlyCookies': True,
        },
        'timeout': 65,
    }


def test_cloudflare_challenge_requires_cloudflare_response_and_marker():
    challenge = SimpleNamespace(
        status_code=403,
        headers={'Server': 'cloudflare', 'Content-Type': 'text/html', 'CF-Ray': 'abc'},
        text='<title>Just a moment...</title>',
    )
    forbidden = SimpleNamespace(
        status_code=403,
        headers={'Content-Type': 'text/html'},
        text='<h1>Forbidden</h1>',
    )

    assert Session._is_cloudflare_challenge(challenge) is True
    assert Session._is_cloudflare_challenge(forbidden) is False

    challenge.status_code = 200
    assert Session._is_cloudflare_challenge(challenge) is True


def test_streaming_cloudflare_challenge_does_not_read_body():
    challenge = SimpleNamespace(
        status_code=403,
        headers={'Server': 'cloudflare', 'Content-Type': 'text/html', 'CF-Ray': 'abc'},
    )
    normal = SimpleNamespace(
        status_code=200,
        headers={'Server': 'cloudflare', 'Content-Type': 'video/mp4', 'CF-Ray': 'abc'},
    )

    assert Session._is_cloudflare_challenge(challenge, inspect_body=False) is True
    assert Session._is_cloudflare_challenge(normal, inspect_body=False) is False


def test_image_probe_does_not_use_site_session(monkeypatch):
    captured = {}
    site = SimpleNamespace(
        id=1,
        spider_key='example',
        alternate_host='https://example.com',
        cookies=None,
        user_agent='Stored UA',
    )
    spider = Spider(site=site)

    def fail_site_request(*args, **kwargs):
        raise AssertionError('site session should not be used')

    monkeypatch.setattr(spider.session, 'get', fail_site_request)

    def fake_get(url, **kwargs):
        captured.update(url=url, **kwargs)
        return FakeResponse(status_code=404)

    monkeypatch.setattr('app.crawlers.base.curl_requests.get', fake_get)

    try:
        assert spider.probe_image_info('https://images.example.net/avatar.jpg') is None
    finally:
        spider.close()

    assert captured['headers'] == {
        'Range': f'bytes=0-{IMAGE_PROBE_RANGE_BYTES - 1}',
        'Referer': 'https://example.com',
    }
    assert captured['impersonate'] == DEFAULT_IMPERSONATE
    assert captured['stream'] is True


def test_session_solves_cloudflare_once_and_retries_get(monkeypatch):
    responses = [
        FakeResponse(
            status_code=403,
            headers={'Server': 'cloudflare', 'Content-Type': 'text/html'},
            text='<title>Just a moment...</title>',
        ),
        FakeResponse(status_code=200),
    ]
    calls = []

    def fake_request(session, method, url, **kwargs):
        calls.append((method, url, kwargs))
        return responses.pop(0)

    monkeypatch.setattr(Session.__mro__[1], 'request', fake_request)
    monkeypatch.setattr(
        'app.crawlers.session.Setting',
        lambda: SimpleNamespace(crawler=SimpleNamespace(flaresolverr_url='http://flaresolverr:8191')),
    )
    monkeypatch.setattr(
        'app.crawlers.flaresolverr.solve',
        lambda url, cookies: (
            [{'name': 'cf_clearance', 'value': 'solved', 'domain': '.example.com', 'path': '/'}],
            'Solved UA',
        ),
    )
    persisted = []
    logged = []
    monkeypatch.setattr('app.crawlers.session.logger.info', logged.append)
    monkeypatch.setattr(
        Session,
        '_persist_cloudflare_solution',
        lambda self, cookies, user_agent, url: persisted.append((cookies, user_agent, url)),
    )

    site = SimpleNamespace(
        id=1,
        spider_key='example',
        alternate_host='https://example.com',
        cookies=None,
        user_agent=None,
    )
    session = Session(site=site)
    session.headers = {'User-Agent': 'Old UA'}
    response = session.get('https://example.com/protected')

    assert response.ok is True
    assert len(calls) == 2
    assert session.headers['User-Agent'] == 'Solved UA'
    assert session.cookies.get('cf_clearance') == 'solved'
    assert persisted[0][1:] == ('Solved UA', 'https://example.com/protected')
    assert len(logged) == 2
    assert 'https://example.com/protected' in logged[0]
    assert 'Solved UA' in logged[1]
    assert 'chrome (chrome146)' in logged[1]
