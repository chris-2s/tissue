from pathlib import Path
from types import SimpleNamespace

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
