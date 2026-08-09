from types import SimpleNamespace

from fastapi import Request

from app.crawlers.session import Session
from app.service.resource import ResourceService


def test_get_remote_url_block_status_rejects_loopback_ip():
    status = ResourceService.get_remote_url_block_status("http://127.0.0.1:8000/video.mp4")

    assert status == 403


def test_get_remote_url_block_status_allows_domain_without_dns_resolution():
    status = ResourceService.get_remote_url_block_status("https://example.com/trailer.m3u8")

    assert status is None


def test_fetch_image_file_returns_403_for_blocked_remote_target():
    result = ResourceService.fetch_image_file("http://127.0.0.1:8000/image.jpg", "cover")

    assert result.status_code == 403
    assert result.file_path is None


def test_proxy_video_returns_403_for_blocked_remote_target():
    service = ResourceService(db=SimpleNamespace())
    request = Request({"type": "http", "headers": [], "method": "GET", "path": "/common/trailer"})

    response = service.proxy_video("http://127.0.0.1:8000/video.mp4", request)

    assert response.status_code == 403


def test_get_site_by_url_matches_same_domain_and_subdomain(monkeypatch):
    site = SimpleNamespace(
        id=1,
        spider_key="javdb",
        alternate_host=None,
        cookies="session=abc",
        user_agent="Stored UA",
    )

    class FakeQuery:
        def all(self):
            return [site]

    service = ResourceService(db=SimpleNamespace(query=lambda _model: FakeQuery()))
    monkeypatch.setattr(
        "app.service.resource.SpiderService.get_spider_class",
        lambda _key: SimpleNamespace(origin_host="https://javdb.com"),
    )

    assert service._get_site_by_url("https://www.javdb.com/video") is site
    assert service._get_site_by_url("https://javdb.com/video") is site


def test_get_site_by_url_rejects_suffix_spoofing(monkeypatch):
    class FakeQuery:
        def all(self):
            return [SimpleNamespace(id=1, spider_key="javdb", alternate_host=None, cookies="session=abc")]

    service = ResourceService(db=SimpleNamespace(query=lambda _model: FakeQuery()))
    monkeypatch.setattr(
        "app.service.resource.SpiderService.get_spider_class",
        lambda _key: SimpleNamespace(origin_host="https://javdb.com"),
    )

    assert service._get_site_by_url("https://eviljavdb.com/video") is None


def test_video_request_uses_stored_cookie_and_user_agent():
    site = SimpleNamespace(
        id=1,
        spider_key="javdb",
        alternate_host="https://javdb.com",
        cookies="session=abc; cf_clearance=solved",
        user_agent="Stored UA",
    )
    request = Request({
        "type": "http",
        "headers": [(b"range", b"bytes=0-99"), (b"user-agent", b"Browser UA")],
        "method": "GET",
        "path": "/common/trailer",
    })
    url = "https://javdb.com/video.mp4"
    headers = ResourceService._build_video_headers(request, url, site)
    session = Session(site=site)

    try:
        assert session.site is site
        assert headers["User-Agent"] == "Stored UA"
        assert session.cookies.get("session") == "abc"
        assert session.cookies.get("cf_clearance") == "solved"
    finally:
        session.close()
