from pathlib import Path
from types import SimpleNamespace

from app.api.common import get_versions
from app.utils.log_stream import build_log_event, format_sse, read_last_lines
from version import APP_VERSION


def test_build_log_event_extracts_structured_fields():
    event = build_log_event("【INFO】2026-06-21 12:00:00 - spider - started")

    assert event == {
        "raw": "【INFO】2026-06-21 12:00:00 - spider - started",
        "level": "INFO",
        "time": "2026-06-21 12:00:00",
        "module": "spider",
        "content": "started",
    }


def test_build_log_event_falls_back_for_unstructured_line():
    event = build_log_event("plain log line")

    assert event["level"] == "INFO"
    assert event["content"] == "plain log line"


def test_format_sse_outputs_json_event():
    payload = {"level": "INFO", "content": "ok"}

    assert format_sse(payload) == 'data: {"level": "INFO", "content": "ok"}\n\n'


def test_read_last_lines_returns_requested_tail(tmp_path: Path):
    log_path = tmp_path / "app.log"
    log_path.write_text("1\n2\n3\n4\n", encoding="utf-8")

    assert read_last_lines(log_path, 2) == ["3\n", "4\n"]


def test_get_versions_uses_remote_version_when_regex_matches(monkeypatch):
    get_versions.cache.clear()
    monkeypatch.setattr(
        "app.api.common.requests.get",
        lambda url, timeout: SimpleNamespace(text="APP_VERSION = 'v9.9.9'"),
    )

    result = get_versions()

    assert result.data == {"current": APP_VERSION[1:], "latest": "9.9.9"}


def test_get_versions_falls_back_to_current_when_regex_missing(monkeypatch):
    get_versions.cache.clear()
    monkeypatch.setattr(
        "app.api.common.requests.get",
        lambda url, timeout: SimpleNamespace(text="invalid payload"),
    )

    result = get_versions()

    assert result.data == {"current": APP_VERSION[1:], "latest": APP_VERSION[1:]}
