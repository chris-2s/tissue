import errno
from pathlib import Path

import pytest

from app import utils


def test_removes_nested_empty_directories_but_preserves_root(tmp_path):
    root = tmp_path.resolve()
    child = root / 'task' / 'nested'
    child.mkdir(parents=True)
    (child / '.DS_Store').write_bytes(b'finder')
    (root / '.DS_Store').write_bytes(b'keep root untouched')

    utils.remove_empty_directories(str(child), root=str(root))

    assert not (root / 'task').exists()
    assert (root / '.DS_Store').exists()


@pytest.mark.parametrize('other_name', ['movie.mp4', 'Thumbs.db', 'desktop.ini', '._movie.mp4'])
def test_preserves_other_files_and_ds_store_in_nonempty_directory(tmp_path, other_name):
    root = tmp_path.resolve()
    child = root / 'task'
    child.mkdir()
    (child / '.DS_Store').touch()
    (child / other_name).touch()

    utils.remove_empty_directories(str(child), root=str(root))

    assert (child / '.DS_Store').exists()
    assert (child / other_name).exists()


@pytest.mark.parametrize('boundary', ['', '/', 'sibling'])
def test_rejects_invalid_boundary(tmp_path, boundary):
    child = tmp_path.resolve() / 'downloads-old'
    child.mkdir()
    (child / '.DS_Store').touch()
    root = str(tmp_path.resolve() / 'downloads') if boundary == 'sibling' else boundary

    utils.remove_empty_directories(str(child), root=root)

    assert (child / '.DS_Store').exists()


def test_preserves_nested_configured_root(tmp_path):
    root = tmp_path.resolve()
    nested_root = root / 'library'
    child = nested_root / 'task'
    child.mkdir(parents=True)
    (nested_root / '.DS_Store').touch()

    utils.remove_empty_directories(str(child), root=str(root), protected_roots=(str(nested_root),))

    assert not child.exists()
    assert (nested_root / '.DS_Store').exists()


def test_preserves_mountpoint(tmp_path, monkeypatch):
    root = tmp_path.resolve()
    mount = root / 'mount'
    mount.mkdir()
    (mount / '.DS_Store').touch()
    monkeypatch.setattr(utils.os.path, 'ismount', lambda path: path == mount)

    utils.remove_empty_directories(str(mount), root=str(root))

    assert (mount / '.DS_Store').exists()


def test_does_not_follow_symlink_ancestor(tmp_path):
    root = tmp_path.resolve()
    target = root / 'outside' / 'task'
    target.mkdir(parents=True)
    (target / '.DS_Store').touch()
    link = root / 'downloads'
    link.symlink_to(target.parent, target_is_directory=True)

    utils.remove_empty_directories(str(link / 'task'), root=str(link))

    assert (target / '.DS_Store').exists()


def test_does_not_unlink_ds_store_symlink(tmp_path):
    root = tmp_path.resolve()
    target = root / 'keep'
    target.touch()
    child = root / 'task'
    child.mkdir()
    (child / '.DS_Store').symlink_to(target)

    utils.remove_empty_directories(str(child), root=str(root))

    assert (child / '.DS_Store').is_symlink()
    assert target.exists()


@pytest.mark.parametrize('error', [errno.EACCES, errno.EROFS, errno.EBUSY, errno.ENOTEMPTY, errno.ENOENT])
def test_cleanup_os_errors_do_not_escape(tmp_path, monkeypatch, error):
    root = tmp_path.resolve()
    child = root / 'task'
    child.mkdir()

    def fail_rmdir(self):
        raise OSError(error, 'cleanup failed')

    monkeypatch.setattr(Path, 'rmdir', fail_rmdir)
    utils.remove_empty_directories(str(child), root=str(root))

    assert root.exists()
    assert child.exists()
