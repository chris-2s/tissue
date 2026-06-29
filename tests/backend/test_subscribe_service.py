from types import SimpleNamespace

import pytest

from app.exception import BizException
from app.exception.codes import ErrorCode
from app.integrations.downloaders.base import AddTorrentResult
from app.middleware.requestvars import g
from app.schema.notification import SubscribeStartedPayload
from app.schema.site import SpiderKey
from app.schema.subscribe import SubscribeCreate
from app.schema.video import SourceRef, VideoDownload
from app.service.subscribe import SubscribeService


class FakeDB:
    def __init__(self):
        self.added = []
        self.flush_calls = 0
        self.commit_calls = 0
        self.rollback_calls = 0

    def add(self, item):
        self.added.append(item)

    def flush(self):
        self.flush_calls += 1

    def commit(self):
        self.commit_calls += 1

    def rollback(self):
        self.rollback_calls += 1


def build_video_download(**kwargs) -> VideoDownload:
    payload = {
        "name": "Test Download",
        "magnet": "magnet:?xt=urn:btih:123",
        "source": SourceRef(site_id=1, spider_key=SpiderKey.JAVDB, site_name="JavDB"),
    }
    payload.update(kwargs)
    return VideoDownload(**payload)


def test_add_subscribe_rejects_duplicate_subscription(monkeypatch):
    service = SubscribeService(db=FakeDB())
    param = SubscribeCreate(num="midv-639", is_hd=True, is_zh=False, is_uncensored=False)
    g().db = service.db

    monkeypatch.setattr(
        service,
        "get_subscribes",
        lambda: [SimpleNamespace(num="MIDV-639", is_hd=True, is_zh=False, is_uncensored=False)],
    )

    with pytest.raises(BizException) as exc_info:
        service.add_subscribe(param)

    assert exc_info.value.error_code == ErrorCode.SUBSCRIBE_ALREADY_EXISTS


def test_download_video_raises_when_qbittorrent_fails(monkeypatch):
    service = SubscribeService(db=FakeDB())
    video = SubscribeCreate(num="MIDV-639")
    link = build_video_download()
    service.setting = SimpleNamespace(download=SimpleNamespace(category="movies"))

    monkeypatch.setattr(
        "app.service.subscribe.downloader_manager.get_active",
        lambda: SimpleNamespace(add_magnet=lambda magnet, download_path, category: AddTorrentResult(success=False)),
    )

    with pytest.raises(BizException, match="下载创建失败"):
        service.download_video(video, link)


def test_download_video_persists_torrent_and_sends_notification(monkeypatch):
    service = SubscribeService(db=FakeDB())
    video = SubscribeCreate(num="MIDV-639", is_zh=True)
    link = build_video_download(is_zh=True, is_uncensored=True)
    captured = {}
    service.setting = SimpleNamespace(download=SimpleNamespace(category="movies"))

    monkeypatch.setattr(
        "app.service.subscribe.downloader_manager.get_active",
        lambda: SimpleNamespace(
            add_magnet=lambda magnet, download_path, category: AddTorrentResult(success=True, torrent_hash="torrent-hash")
        ),
    )
    monkeypatch.setattr(
        "app.service.subscribe.notification_manager.emit_subscribe_started",
        lambda payload: captured.setdefault("payload", payload),
    )

    service.download_video(video, link)

    assert len(service.db.added) == 1
    assert service.db.added[0].hash == "torrent-hash"
    assert service.db.added[0].num == "MIDV-639"
    assert isinstance(captured["payload"], SubscribeStartedPayload)
    assert captured["payload"].source.site_name == "JavDB"
    assert captured["payload"].url is None
