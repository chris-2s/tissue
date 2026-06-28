from datetime import datetime
from types import SimpleNamespace

from app.integrations.notifications.base import NotificationEvent
from app.integrations.notifications.manager import NotificationManager
from app.schema.notification import SubscribeStartedPayload, VideoSavedPayload
from app.schema.video import SourceRef, VideoActor


class FakeProvider:
    def __init__(self):
        self.events: list[NotificationEvent] = []

    def send(self, event: NotificationEvent) -> None:
        self.events.append(event)


def test_emit_video_saved_builds_versioned_event(monkeypatch):
    manager = NotificationManager()
    provider = FakeProvider()
    monkeypatch.setattr(manager, "get_active", lambda: provider)

    payload = VideoSavedPayload(
        num="MIDV-639",
        path="/downloads/MIDV-639.mp4",
        size="1GB",
        actors=[VideoActor(name="Alice")],
    )

    manager.emit_video_saved(payload)

    assert len(provider.events) == 1
    event = provider.events[0]
    assert event.event == "video.saved"
    assert event.version == 1
    assert isinstance(event.timestamp, datetime)
    assert event.payload["num"] == "MIDV-639"


def test_emit_subscribe_started_preserves_payload_shape(monkeypatch):
    manager = NotificationManager()
    provider = FakeProvider()
    monkeypatch.setattr(manager, "get_active", lambda: provider)

    payload = SubscribeStartedPayload(
        num="MIDV-639",
        source=SourceRef(site_id=1, spider_key="javdb", site_name="JavDB"),
        name="Download Name",
    )

    manager.emit_subscribe_started(payload)

    event = provider.events[0]
    assert event.event == "subscribe.started"
    assert event.payload["source"]["site_name"] == "JavDB"

