from datetime import date
from types import SimpleNamespace

from app.schema.home import SiteVideo
from app.schema.site import SpiderKey
from app.schema.video import (
    SourceRef,
    VideoComment,
    VideoCommentItem,
    VideoActor,
    VideoDetail,
    VideoDownload,
    VideoPreview,
    VideoPreviewItem,
    VideoSiteActor,
)
from app.service.spider import SpiderService


def build_source(site_id: int, spider_key: SpiderKey, site_name: str) -> SourceRef:
    return SourceRef(site_id=site_id, spider_key=spider_key, site_name=site_name)


def test_merge_video_info_fills_missing_fields_and_sorts_downloads():
    primary = VideoDetail(
        num="MIDV-639",
        title="",
        cover=None,
        actors=[],
        downloads=[
            VideoDownload(
                name="older",
                publish_date=date(2024, 1, 1),
                source=build_source(1, SpiderKey.JAVDB, "JavDB"),
            )
        ],
        previews=[
            VideoPreview(
                source=build_source(1, SpiderKey.JAVDB, "JavDB"),
                items=[VideoPreviewItem(url="https://a.example/1.jpg")],
            )
        ],
        comments=[
            VideoComment(
                source=build_source(1, SpiderKey.JAVDB, "JavDB"),
                items=[VideoCommentItem(id="1", content="a")],
            )
        ],
    )
    secondary = VideoDetail(
        num="MIDV-639",
        title="Merged Title",
        cover="https://image.example/cover.jpg",
        actors=[VideoActor(name="Actor A")],
        website=["https://javbus.example/detail"],
        downloads=[
            VideoDownload(
                name="newer",
                publish_date=date(2024, 5, 1),
                source=build_source(2, SpiderKey.JAVBUS, "JavBus"),
            )
        ],
        previews=[
            VideoPreview(
                source=build_source(2, SpiderKey.JAVBUS, "JavBus"),
                items=[VideoPreviewItem(url="https://b.example/1.jpg")],
            )
        ],
        comments=[
            VideoComment(
                source=build_source(2, SpiderKey.JAVBUS, "JavBus"),
                items=[VideoCommentItem(id="2", content="b")],
            )
        ],
        site_actors=[
            VideoSiteActor(
                source=build_source(2, SpiderKey.JAVBUS, "JavBus"),
                items=[VideoActor(name="Actor A")],
            )
        ],
    )

    merged = SpiderService(db=SimpleNamespace())._merge_video_info([primary, secondary])

    assert merged.title == "Merged Title"
    assert merged.cover == "https://image.example/cover.jpg"
    assert [item.name for item in merged.actors] == ["Actor A"]
    assert merged.website == ["https://javbus.example/detail"]
    assert [item.name for item in merged.downloads] == ["newer", "older"]
    assert len(merged.previews) == 2
    assert len(merged.comments) == 2
    assert len(merged.site_actors) == 1


def test_get_cookies_by_url_matches_registered_site():
    db = SimpleNamespace()
    service = SpiderService(db=db)
    db.query = lambda model: SimpleNamespace(
        all=lambda: [
            SimpleNamespace(
                spider_key=SpiderKey.JAVDB,
                alternate_host="https://mirror.javdb.com",
                cookies="session=abc",
            ),
            SimpleNamespace(
                spider_key=SpiderKey.JAVBUS,
                alternate_host=None,
                cookies="bus=xyz",
            ),
        ]
    )

    assert service.get_cookies_by_url("https://video.mirror.javdb.com/trailer.mp4") == "session=abc"


def test_get_cookies_by_url_returns_none_when_no_site_matches():
    db = SimpleNamespace()
    service = SpiderService(db=db)
    db.query = lambda model: SimpleNamespace(
        all=lambda: [
            SimpleNamespace(
                spider_key=SpiderKey.JAVDB,
                alternate_host="https://mirror.javdb.com",
                cookies="session=abc",
            )
        ]
    )

    assert service.get_cookies_by_url("https://unrelated.example/video.mp4") is None
