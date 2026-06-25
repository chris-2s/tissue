from datetime import date
import asyncio
from types import SimpleNamespace

from app.schema.home import SiteVideo
from app.schema.actor import Actor
from app.schema.site import MetadataPriorityFieldKey, MetadataPriorityUpdate, MetadataPriorityFieldsUpdate, SpiderKey
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
from app.service.metadata_priority import MetadataPriorityService
from app.service.spider import SpiderService


def build_source(site_id: int, spider_key: SpiderKey, site_name: str) -> SourceRef:
    return SourceRef(site_id=site_id, spider_key=spider_key, site_name=site_name)


def test_merge_video_info_fills_missing_fields_and_sorts_downloads(monkeypatch):
    primary = VideoDetail(
        source=build_source(1, SpiderKey.JAVBUS, "JavBus"),
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
        source=build_source(2, SpiderKey.JAVDB, "JavDB"),
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

    monkeypatch.setattr(
        MetadataPriorityService,
        "get_effective_field_orders",
        lambda self: {
            "cover": [SpiderKey.JAVBUS, SpiderKey.JAVDB],
            "rating": [SpiderKey.JAVBUS, SpiderKey.JAVDB],
            "actors": [SpiderKey.JAVBUS, SpiderKey.JAVDB],
        },
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


def test_merge_video_info_uses_field_level_priority_overrides(monkeypatch):
    primary = VideoDetail(
        source=build_source(1, SpiderKey.JAVBUS, "JavBus"),
        num="MIDV-639",
        title="Bus Title",
        cover="https://bus.example/cover.jpg",
        rating="7.1",
        actors=[VideoActor(name="Bus Actor")],
    )
    secondary = VideoDetail(
        source=build_source(2, SpiderKey.JAVDB, "JavDB"),
        num="MIDV-639",
        title="Db Title",
        cover="https://db.example/cover.jpg",
        rating="8.8",
        actors=[VideoActor(name="Db Actor")],
    )

    monkeypatch.setattr(
        MetadataPriorityService,
        "get_effective_field_orders",
        lambda self: {
            "cover": [SpiderKey.JAVBUS, SpiderKey.JAVDB],
            "rating": [SpiderKey.JAVDB, SpiderKey.JAVBUS],
            "actors": [SpiderKey.JAVDB, SpiderKey.JAVBUS],
        },
    )

    merged = SpiderService(db=SimpleNamespace())._merge_video_info([primary, secondary])

    assert merged.cover == "https://bus.example/cover.jpg"
    assert merged.rating == "8.8"
    assert [item.name for item in merged.actors] == ["Db Actor"]


def test_metadata_priority_settings_fall_back_to_global_order(monkeypatch):
    service = MetadataPriorityService(db=SimpleNamespace())

    monkeypatch.setattr(
        service,
        "get_global_site_order",
        lambda: [SpiderKey.JAVBUS, SpiderKey.JAVDB, SpiderKey.DMM],
    )
    monkeypatch.setattr(
        service,
        "_get_custom_site_order",
        lambda field: [SpiderKey.JAVDB] if field == MetadataPriorityFieldKey.RATING else [],
    )

    settings = service.get_settings()

    assert settings.global_sites == [SpiderKey.JAVBUS, SpiderKey.JAVDB, SpiderKey.DMM]
    assert settings.fields.cover.sites == [SpiderKey.JAVBUS, SpiderKey.JAVDB, SpiderKey.DMM]
    assert settings.fields.cover.is_default is True
    assert settings.fields.rating.sites == [SpiderKey.JAVDB, SpiderKey.JAVBUS, SpiderKey.DMM]
    assert settings.fields.rating.is_default is False


def test_metadata_priority_save_settings_stores_only_custom_order(monkeypatch):
    deleted_fields = []
    inserted = []
    committed = []

    class FakeQuery:
        def __init__(self):
            self.field_key = None

        def filter(self, expression):
            self.field_key = expression.right.value
            return self

        def delete(self, synchronize_session=False):
            deleted_fields.append((self.field_key, synchronize_session))

    class FakeDb:
        def query(self, model):
            return FakeQuery()

        def add(self, item):
            inserted.append((item.field_key, item.spider_key, item.priority))

        def commit(self):
            committed.append(True)

    service = MetadataPriorityService(db=FakeDb())
    monkeypatch.setattr(
        service,
        "get_global_site_order",
        lambda: [SpiderKey.JAVBUS, SpiderKey.JAVDB, SpiderKey.DMM],
    )

    payload = MetadataPriorityUpdate(
        fields=MetadataPriorityFieldsUpdate(
            cover=[SpiderKey.JAVBUS, SpiderKey.JAVDB, SpiderKey.DMM],
            rating=[SpiderKey.JAVDB, SpiderKey.JAVBUS],
            actors=[SpiderKey.JAVBUS, SpiderKey.JAVDB, SpiderKey.DMM],
        )
    )

    service.save_settings(payload)

    assert deleted_fields == [
        ("cover", False),
        ("rating", False),
        ("actors", False),
    ]
    assert inserted == [
        ("rating", "javdb", 1),
        ("rating", "javbus", 2),
        ("rating", "dmm", 3),
    ]
    assert committed == [True]


def test_search_actor_results_follow_actors_priority(monkeypatch):
    class FakeSpider:
        supports_actor = True

        def __init__(self, key, actor_name):
            self.key = key
            self.name = key
            self.actor_name = actor_name

        def search_actor(self, name):
            return [Actor(name=self.actor_name, source=build_source(1, self.key, self.name))]

        def probe_image_info(self, url):
            return None

        def close(self):
            return None

    service = SpiderService(db=SimpleNamespace())
    monkeypatch.setattr(
        service,
        "_get_spiders",
        lambda: [
            FakeSpider(SpiderKey.JAVBUS, "Bus Actor"),
            FakeSpider(SpiderKey.JAVDB, "Db Actor"),
        ],
    )
    monkeypatch.setattr(
        MetadataPriorityService,
        "get_effective_site_order",
        lambda self, field, global_sites=None: [SpiderKey.JAVDB, SpiderKey.JAVBUS],
    )

    actors = asyncio.run(service._search_actor_by_spiders("Alice"))

    assert [actor.name for actor in actors] == ["Db Actor", "Bus Actor"]
