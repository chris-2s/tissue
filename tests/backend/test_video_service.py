import errno
import os
from pathlib import Path
from types import SimpleNamespace

import pytest

import app.service.video as video_module
from app.schema import PosterCrop, VideoActor, VideoDetail
from app.service.video import VideoService


def test_get_videos_orders_by_video_mtime_descending(tmp_path: Path, monkeypatch):
    older_video = tmp_path / "older.mp4"
    newer_video = tmp_path / "newer.mp4"
    older_video.write_text("older video")
    newer_video.write_text("newer video")
    os.utime(older_video, (1000, 1000))
    os.utime(newer_video, (2000, 2000))

    monkeypatch.setattr(video_module, "Setting", lambda: SimpleNamespace(
        library=SimpleNamespace(
            video_path=str(tmp_path),
            video_format=".mp4",
            video_size_minimum=0,
        )
    ))
    monkeypatch.setattr(video_module.nfo, "get_basic", lambda *_args, **_kwargs: None)

    service = VideoService(db=SimpleNamespace())

    videos = VideoService.get_videos.__wrapped__(service)

    assert [video.path for video in videos] == [str(newer_video), str(older_video)]


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

    captured: dict[str, object] = {}

    monkeypatch.setattr(video_module, "Setting", lambda: SimpleNamespace(
        library=SimpleNamespace(video_path=str(tmp_path / "library")),
        file=SimpleNamespace(trans_mode="copy", path=str(tmp_path / "files")),
        download=SimpleNamespace(trans_mode="hardlink", mapping_path=str(tmp_path / "downloads")),
    ))
    monkeypatch.setattr(video_module.utils, "convert_size", lambda _: "5 B")
    monkeypatch.setattr(video_module.notification_manager, "emit_video_saved", lambda *_args, **_kwargs: None)
    monkeypatch.setattr(video_module.video_cache, "pop", lambda *_args, **_kwargs: None)

    service = VideoService(db=SimpleNamespace(commit=lambda: None))

    def fake_trans(video, video_path, trans_mode, **kwargs):
        captured["trans_mode"] = trans_mode
        captured["video_path"] = video_path
        return str(tmp_path / "library" / "MIDV-639.mp4")

    monkeypatch.setattr(service, "trans", fake_trans)
    monkeypatch.setattr(video_module.History, "add", lambda self, db: None)

    poster_crop = PosterCrop(x=52.625, y=0, width=47.375, height=100)
    video = VideoDetail(
        title="Test Title",
        num="MIDV-639",
        path=str(source_video),
        poster_crop=poster_crop,
    )

    service.save_video(video, mode="video")

    assert captured["trans_mode"] == "move"
    assert captured["video_path"] == str(tmp_path / "library")
    assert video.poster_crop == poster_crop


@pytest.mark.parametrize('mode, expected', [
    ('file', 'files'), ('download', 'downloads'), ('video', 'library'),
    ('history', 'downloads'), (None, 'downloads'),
])
def test_cleanup_boundary_matches_operation(tmp_path, mode, expected):
    setting = SimpleNamespace(
        file=SimpleNamespace(path=str(tmp_path / 'files')),
        download=SimpleNamespace(mapping_path=str(tmp_path / 'downloads')),
        library=SimpleNamespace(video_path=str(tmp_path / 'library')),
    )
    root, protected = VideoService.get_cleanup_boundary(str(tmp_path / 'downloads' / 'movie.mp4'), setting, mode)
    assert root == str(tmp_path / expected)
    assert set(protected) == {str(tmp_path / name) for name in ('files', 'downloads', 'library')}


def test_history_cleanup_uses_deepest_root_and_skips_unknown_paths(tmp_path):
    setting = SimpleNamespace(
        file=SimpleNamespace(path=str(tmp_path)),
        download=SimpleNamespace(mapping_path=str(tmp_path / 'downloads')),
        library=SimpleNamespace(video_path=str(tmp_path / 'downloads' / 'library')),
    )
    root, _ = VideoService.get_cleanup_boundary(str(tmp_path / 'downloads' / 'library' / 'movie.mp4'), setting, 'history')
    assert root == setting.library.video_path
    root, _ = VideoService.get_cleanup_boundary(str(tmp_path.parent / 'unknown' / 'movie.mp4'), setting, 'history')
    assert root is None


def test_move_cleanup_failure_still_saves_nfo_and_history(tmp_path, monkeypatch):
    root = tmp_path.resolve()
    files = root / 'files'
    source_dir = files / 'task'
    source_dir.mkdir(parents=True)
    source = source_dir / 'MIDV-639.mp4'
    source.write_bytes(b'video')
    library = root / 'library'
    monkeypatch.setattr(video_module, 'Setting', lambda: SimpleNamespace(
        file=SimpleNamespace(path=str(files), trans_mode='move'),
        download=SimpleNamespace(mapping_path=str(root / 'downloads')),
        library=SimpleNamespace(video_path=str(library)),
    ))
    monkeypatch.setattr(video_module.nfo, 'save', lambda path, video: Path(path).write_text('nfo'))
    monkeypatch.setattr(video_module.notification_manager, 'emit_video_saved', lambda *_: None)
    histories = []
    monkeypatch.setattr(video_module.History, 'add', lambda self, db: histories.append(self))

    def fail_rmdir(self):
        raise PermissionError(errno.EACCES, 'permission denied')

    monkeypatch.setattr(Path, 'rmdir', fail_rmdir)
    service = VideoService(db=SimpleNamespace(commit=lambda: None))
    service.save_video(VideoDetail(title='Test', num='MIDV-639', path=str(source)), mode='file')

    assert not source.exists()
    assert len(histories) == 1
    dest = Path(histories[0].dest_path)
    assert dest.read_bytes() == b'video'
    assert (dest.parent / 'movie.nfo').read_text() == 'nfo'


def test_delete_video_preserves_library_root(tmp_path, monkeypatch):
    root = tmp_path.resolve()
    source = root / 'movie.mp4'
    source.touch()
    (root / '.DS_Store').touch()
    monkeypatch.setattr(video_module, 'Setting', lambda: SimpleNamespace(
        file=SimpleNamespace(path=str(root / 'files')),
        download=SimpleNamespace(mapping_path=str(root / 'downloads')),
        library=SimpleNamespace(video_path=str(root)),
    ))
    service = VideoService(db=SimpleNamespace())
    monkeypatch.setattr(service, 'delete_video_meta', lambda _: None)
    service.delete_video(str(source))

    assert not source.exists()
    assert (root / '.DS_Store').exists()


@pytest.mark.parametrize('trans_mode', ['copy', 'hardlink', 'symlink'])
def test_non_move_transfer_leaves_source_ds_store_untouched(tmp_path, monkeypatch, trans_mode):
    root = tmp_path.resolve()
    source_dir = root / 'files'
    source_dir.mkdir()
    source = source_dir / 'MIDV-639.mp4'
    source.write_bytes(b'video')
    ds_store = source_dir / '.DS_Store'
    ds_store.touch()
    monkeypatch.setattr(video_module.nfo, 'save', lambda path, video: Path(path).write_text('nfo'))
    service = VideoService(db=SimpleNamespace())

    dest = service.trans(VideoDetail(title='Test', num='MIDV-639', path=str(source)),
                         str(root / 'library'), trans_mode, cleanup_root=str(root))

    assert source.exists()
    assert ds_store.exists()
    assert Path(dest).read_bytes() == b'video'
