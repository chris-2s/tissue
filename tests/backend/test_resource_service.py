import asyncio
from types import SimpleNamespace

from fastapi import Request

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


def test_proxy_trailer_returns_403_for_blocked_remote_target():
    service = ResourceService(db=SimpleNamespace())
    request = Request({"type": "http", "headers": [], "method": "GET", "path": "/common/trailer"})

    response = asyncio.run(service.proxy_trailer("http://127.0.0.1:8000/video.mp4", request))

    assert response.status_code == 403


def test_get_cookies_by_url_matches_same_domain_and_subdomain(monkeypatch):
    class FakeQuery:
        def all(self):
            return [SimpleNamespace(spider_key="javdb", alternate_host=None, cookies="session=abc")]

    service = ResourceService(db=SimpleNamespace(query=lambda _model: FakeQuery()))
    monkeypatch.setattr(
        "app.service.resource.SpiderService.get_spider_class",
        lambda _key: SimpleNamespace(origin_host="https://javdb.com"),
    )

    assert service._get_cookies_by_url("https://www.javdb.com/video") == "session=abc"
    assert service._get_cookies_by_url("https://javdb.com/video") == "session=abc"


def test_get_cookies_by_url_rejects_suffix_spoofing(monkeypatch):
    class FakeQuery:
        def all(self):
            return [SimpleNamespace(spider_key="javdb", alternate_host=None, cookies="session=abc")]

    service = ResourceService(db=SimpleNamespace(query=lambda _model: FakeQuery()))
    monkeypatch.setattr(
        "app.service.resource.SpiderService.get_spider_class",
        lambda _key: SimpleNamespace(origin_host="https://javdb.com"),
    )

    assert service._get_cookies_by_url("https://eviljavdb.com/video") is None
