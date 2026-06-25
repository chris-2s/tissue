from pathlib import Path
from types import SimpleNamespace

import app.service.video as video_module
from app.schema import VideoActor, VideoDetail
from app.service.video import VideoService


def test_find_subtitle_paths_prefers_same_name_file(tmp_path: Path):
    video_path = tmp_path / "MIDV-639.mp4"
    subtitle_path = tmp_path / "MIDV-639.srt"
    other_subtitle = tmp_path / "another.ass"
    video_path.write_text("video")
    subtitle_path.write_text("subtitle")
    other_subtitle.write_text("ignored")

    service = VideoService(db=SimpleNamespace())

    result = service.find_subtitle_paths(str(video_path), "MIDV-639")

    assert result == [str(subtitle_path)]


def test_find_subtitle_paths_falls_back_to_parsed_candidates(tmp_path: Path):
    video_path = tmp_path / "source.mp4"
    matched_subtitle = tmp_path / "MIDV-639-zh.srt"
    longer_match = tmp_path / "MIDV-639-longer-name.srt"
    video_path.write_text("video")
    matched_subtitle.write_text("subtitle")
    longer_match.write_text("subtitle")

    service = VideoService(db=SimpleNamespace())

    result = service.find_subtitle_paths(str(video_path), "MIDV-639")

    assert result == [str(matched_subtitle)]


def test_trans_subtitles_copies_and_normalizes_extension(tmp_path: Path):
    source_video = tmp_path / "MIDV-639.mp4"
    dest_dir = tmp_path / "library"
    dest_dir.mkdir()
    dest_video = dest_dir / "MIDV-639-C.mp4"
    subtitle_path = tmp_path / "MIDV-639.ASS"
    source_video.write_text("video")
    dest_video.write_text("video")
    subtitle_path.write_text("subtitle")

    service = VideoService(db=SimpleNamespace())

    service.trans_subtitles(str(source_video), str(dest_video), [str(subtitle_path)], "copy")

    copied_path = dest_dir / "MIDV-639-C.ass"
    assert copied_path.exists()
    assert copied_path.read_text() == "subtitle"
    assert subtitle_path.exists()


def test_trans_subtitles_moves_source_when_requested(tmp_path: Path):
    source_video = tmp_path / "MIDV-639.mp4"
    dest_dir = tmp_path / "library"
    dest_dir.mkdir()
    dest_video = dest_dir / "MIDV-639.mp4"
    subtitle_path = tmp_path / "MIDV-639.srt"
    source_video.write_text("video")
    dest_video.write_text("video")
    subtitle_path.write_text("subtitle")

    service = VideoService(db=SimpleNamespace())

    service.trans_subtitles(str(source_video), str(dest_video), [str(subtitle_path)], "move")

    moved_path = dest_dir / "MIDV-639.srt"
    assert moved_path.exists()
    assert moved_path.read_text() == "subtitle"
    assert not subtitle_path.exists()


def test_trans_marks_video_as_zh_when_subtitle_detected(tmp_path: Path, monkeypatch):
    source_video = tmp_path / "MIDV-639.mp4"
    subtitle_path = tmp_path / "MIDV-639.srt"
    library_dir = tmp_path / "library"
    source_video.write_text("video")
    subtitle_path.write_text("subtitle")

    monkeypatch.setattr(video_module.ResourceService, "fetch_image_file", lambda *args, **kwargs: SimpleNamespace(file_path=None))
    monkeypatch.setattr(video_module, "save_images", lambda *args, **kwargs: None)
    monkeypatch.setattr(video_module.nfo, "save", lambda path, video: Path(path).write_text("nfo"))

    service = VideoService(db=SimpleNamespace())
    video = VideoDetail(
        title="Test Title",
        num="MIDV-639",
        path=str(source_video),
        is_zh=False,
        is_uncensored=False,
        actors=[VideoActor(name="Alice")],
    )

    dest_path = service.trans(video, str(library_dir), "copy")

    assert video.is_zh is True
    assert dest_path.endswith("MIDV-639-C.mp4")
    assert (library_dir / "Alice" / "Test Title" / "MIDV-639-C.srt").exists()


def test_trans_keeps_uncensored_tag_when_subtitle_promotes_zh(tmp_path: Path, monkeypatch):
    source_video = tmp_path / "MIDV-639.mp4"
    subtitle_path = tmp_path / "MIDV-639.srt"
    library_dir = tmp_path / "library"
    source_video.write_text("video")
    subtitle_path.write_text("subtitle")

    monkeypatch.setattr(video_module.ResourceService, "fetch_image_file", lambda *args, **kwargs: SimpleNamespace(file_path=None))
    monkeypatch.setattr(video_module, "save_images", lambda *args, **kwargs: None)
    monkeypatch.setattr(video_module.nfo, "save", lambda path, video: Path(path).write_text("nfo"))

    service = VideoService(db=SimpleNamespace())
    video = VideoDetail(
        title="Test Title",
        num="MIDV-639",
        path=str(source_video),
        is_zh=False,
        is_uncensored=True,
        actors=[VideoActor(name="Alice")],
    )

    dest_path = service.trans(video, str(library_dir), "copy")

    assert video.is_zh is True
    assert video.is_uncensored is True
    assert dest_path.endswith("MIDV-639-UC.mp4")
    assert (library_dir / "Alice" / "Test Title" / "MIDV-639-UC.srt").exists()


def test_save_video_defaults_to_move_for_video_mode(tmp_path: Path, monkeypatch):
    source_video = tmp_path / "MIDV-639.mp4"
    source_video.write_text("video")

    captured: dict[str, str] = {}

    monkeypatch.setattr(video_module, "Setting", lambda: SimpleNamespace(
        app=SimpleNamespace(video_path=str(tmp_path / "library")),
        file=SimpleNamespace(trans_mode="copy"),
        download=SimpleNamespace(trans_mode="hardlink"),
    ))
    monkeypatch.setattr(video_module.utils, "convert_size", lambda _: "5 B")
    monkeypatch.setattr(video_module.notify, "send_video", lambda *_args, **_kwargs: None)
    monkeypatch.setattr(video_module.video_cache, "pop", lambda *_args, **_kwargs: None)

    service = VideoService(db=SimpleNamespace(commit=lambda: None))

    def fake_trans(video, video_path, trans_mode):
        captured["trans_mode"] = trans_mode
        captured["video_path"] = video_path
        return str(tmp_path / "library" / "MIDV-639.mp4")

    monkeypatch.setattr(service, "trans", fake_trans)
    monkeypatch.setattr(video_module.History, "add", lambda self, db: None)

    video = VideoDetail(title="Test Title", num="MIDV-639", path=str(source_video))

    service.save_video(video, mode="video")

    assert captured["trans_mode"] == "move"
    assert captured["video_path"] == str(tmp_path / "library")
