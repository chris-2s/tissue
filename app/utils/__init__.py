import errno
import os
from pathlib import Path

from app.i18n import translate
from app.utils.logger import logger


def convert_size(text, bits=2):
    units = ["B", "KB", "MB", "GB", "TB", "PB"]
    size = 1024
    for i in range(len(units)):
        if (text / size) < 1:
            return f"%.{bits}f%s" % (text, units[i])
        text = text / size


def remove_empty_directories(start_dir: str, *, root: str, protected_roots: tuple[str, ...] = ()):
    """Remove empty ancestors strictly inside root; cleanup must not fail the main operation."""
    if not start_dir or not start_dir.strip() or not root or not root.strip():
        return
    current = Path(os.path.abspath(start_dir))
    boundary = Path(os.path.abspath(root))
    if boundary == Path(boundary.anchor) or not current.is_relative_to(boundary):
        return
    protected = {Path(os.path.abspath(path)) for path in protected_roots if path and path.strip()}
    protected.add(boundary)

    try:
        # Check every component before touching anything, including ancestors of root.
        if any(path.is_symlink() for path in (current, *current.parents)):
            return
        while current != boundary and current.is_relative_to(boundary):
            if current in protected or current.is_symlink() or os.path.ismount(current):
                return
            children = list(current.iterdir())
            if children:
                if len(children) != 1 or children[0].name != '.DS_Store':
                    return
                ds_store = children[0]
                if ds_store.is_symlink() or not ds_store.is_file():
                    return
                ds_store.unlink()
            current.rmdir()
            current = current.parent
    except OSError as exc:
        if exc.errno not in {errno.ENOENT, errno.ENOTEMPTY, errno.EEXIST}:
            logger.warning(translate('log.file.directory_cleanup_failed', {'path': str(current), 'error': str(exc)}))
