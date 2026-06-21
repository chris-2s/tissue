from pathlib import Path
from types import SimpleNamespace

from app.exception import BizException
from app.schema.download import Torrent, TorrentFile
from app.schema.video import VideoDetail
from app.service.download import DownloadService


class FakeQuery:
    def __init__(self, matched_torrent=None):
        self.matched_torrent = matched_torrent
        self.deleted = False

    def filter_by(self, **kwargs):
        return self

    def order_by(self, *args, **kwargs):
        return self

    def limit(self, value):
        return self

    def one_or_none(self):
        return self.matched_torrent

    def delete(self):
        self.deleted = True


class FakeDB:
    def __init__(self, matched_torrent=None):
        self.added = []
        self.query_object = FakeQuery(matched_torrent=matched_torrent)

    def add(self, item):
        self.added.append(item)

    def query(self, model):
        return self.query_object


class FakeVideoService:
    def __init__(self, db, parsed=None, scraped=None, scrape_error=None):
        self.db = db
        self.parsed = parsed
        self.scraped = scraped
        self.scrape_error = scrape_error
        self.saved = []
        self.parse_calls = []
        self.scrape_calls = []

    def parse_video(self, path):
        self.parse_calls.append(path)
        return self.parsed

    def scrape_video(self, num):
        self.scrape_calls.append(num)
        if self.scrape_error:
            raise self.scrape_error
        return self.scraped

    def save_video(self, video, mode=None):
        self.saved.append((video, mode))


class FakeQB:
    def __init__(self, torrents, files):
        self.torrents = torrents
        self.files = files

    def get_torrents(self, category, include_success=False, include_failed=True):
        return self.torrents

    def get_torrent_files(self, torrent_hash):
        return self.files[torrent_hash]


def build_download_service(db) -> DownloadService:
    service = DownloadService(db=db)
    service.setting = SimpleNamespace(
        download=SimpleNamespace(
            host="http://qb.example",
            category="movies",
            download_path="/downloads",
            mapping_path="/mapped",
            trans_mode="move",
        ),
        app=SimpleNamespace(video_format=".mp4,.mkv", video_size_minimum=1),
    )
    return service


def test_get_downloads_filters_files_and_maps_path():
    db = FakeDB()
    service = build_download_service(db)
    service.qb = FakeQB(
        torrents=[
            {
                "hash": "hash-1",
                "name": "Torrent A",
                "total_size": 2_000_000,
                "save_path": "/downloads/folder",
                "content_path": "/downloads/folder/video.mp4",
                "tags": " tag1, tag2 ",
            }
        ],
        files={
            "hash-1": [
                {"name": "video.mp4", "progress": 1, "priority": 1, "size": 2_000_000},
                {"name": "small.mp4", "progress": 1, "priority": 1, "size": 100},
                {"name": "skip.txt", "progress": 1, "priority": 1, "size": 2_000_000},
            ]
        },
    )

    torrents = service.get_downloads()

    assert len(torrents) == 1
    assert torrents[0].tags == ["tag1", "tag2"]
    assert torrents[0].files == [
        TorrentFile(name="video.mp4", size="1.91MB", path="/mapped/folder/video.mp4")
    ]


def test_scrape_download_uses_matched_torrent_and_deletes_record(monkeypatch):
    matched_torrent = SimpleNamespace(
        hash="hash-1",
        num="MIDV-639",
        is_zh=True,
        is_uncensored=False,
    )
    db = FakeDB(matched_torrent=matched_torrent)
    service = build_download_service(db)
    completed = {}
    video_service = FakeVideoService(
        db=db,
        scraped=VideoDetail(num="MIDV-639", title="Video Title"),
    )
    torrent = Torrent(
        hash="hash-1",
        name="Torrent A",
        size="2 MB",
        path="/downloads",
        tags=[],
        files=[TorrentFile(name="video.mp4", size="2 MB", path="/downloads/video.mp4")],
    )

    monkeypatch.setattr(service, "complete_download", lambda torrent_hash, is_success=True: completed.update({
        "hash": torrent_hash,
        "is_success": is_success,
    }))

    service.scrape_download(video_service, torrent, "move")

    assert video_service.parse_calls == []
    assert video_service.scrape_calls == ["MIDV-639"]
    assert len(video_service.saved) == 1
    saved_video, saved_mode = video_service.saved[0]
    assert saved_mode == "download"
    assert saved_video.path == "/downloads/video.mp4"
    assert saved_video.is_zh is True
    assert db.query_object.deleted is True
    assert completed == {"hash": "hash-1", "is_success": True}


def test_scrape_download_records_failure_and_notifies(monkeypatch, tmp_path: Path):
    db = FakeDB()
    service = build_download_service(db)
    completed = {}
    notifications = []
    file_path = tmp_path / "MIDV-639.mp4"
    file_path.write_text("video")
    video_service = FakeVideoService(
        db=db,
        parsed=VideoDetail(num="MIDV-639", path=str(file_path)),
        scrape_error=BizException("刮削失败"),
    )
    torrent = Torrent(
        hash="hash-2",
        name="Torrent B",
        size="2 MB",
        path=str(tmp_path),
        tags=[],
        files=[TorrentFile(name="MIDV-639.mp4", size="2 MB", path=str(file_path))],
    )

    monkeypatch.setattr(service, "complete_download", lambda torrent_hash, is_success=True: completed.update({
        "hash": torrent_hash,
        "is_success": is_success,
    }))
    monkeypatch.setattr("app.service.download.notify.send_video", lambda payload: notifications.append(payload))

    service.scrape_download(video_service, torrent, "copy")

    assert len(db.added) == 1
    history = db.added[0]
    assert history.status == 0
    assert history.num == "MIDV-639"
    assert history.source_path == str(file_path)
    assert notifications[0].is_success is False
    assert notifications[0].message == "刮削失败"
    assert notifications[0].size == "5.00B"
    assert completed == {"hash": "hash-2", "is_success": False}
