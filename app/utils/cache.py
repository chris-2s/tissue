import hashlib
import json
import os
import shutil
import tempfile
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Literal


cache_path = Path(f'{Path(__file__).cwd()}/config/cache')
CACHE_LAYOUT_VERSION = '2'
cache_version_file = cache_path / '.cache_version'
CACHE_IMAGE_PARENTS = ('cover', 'avatar')

IMAGE_SUCCESS_TTL_SECONDS = 30 * 24 * 60 * 60
IMAGE_STALE_FALLBACK_TTL_SECONDS = 60 * 60
IMAGE_RETENTION_SECONDS = 30 * 24 * 60 * 60
NEGATIVE_TTL_BY_STATUS = {
    403: 30 * 60,
    404: 6 * 60 * 60,
    410: 6 * 60 * 60,
    429: 30 * 60,
}
DEFAULT_NEGATIVE_TTL_SECONDS = 10 * 60


CacheStatus = Literal['hit', 'negative']
LookupStatus = Literal['fresh', 'expired', 'missing']


@dataclass(slots=True)
class CacheLookup:
    status: LookupStatus
    cache_status: CacheStatus | None = None
    file_path: Path | None = None
    metadata_path: Path | None = None
    metadata: dict[str, Any] | None = None


def ensure_cache_layout():
    cache_path.mkdir(parents=True, exist_ok=True)

    current_version = None
    if cache_version_file.exists():
        current_version = cache_version_file.read_text(encoding='utf-8').strip()

    if current_version == CACHE_LAYOUT_VERSION:
        return

    for parent in CACHE_IMAGE_PARENTS:
        legacy_path = cache_path / parent
        if legacy_path.exists():
            shutil.rmtree(legacy_path, ignore_errors=True)

    cache_version_file.write_text(CACHE_LAYOUT_VERSION, encoding='utf-8')


def get_negative_ttl_seconds(status_code: int | None) -> int:
    if status_code is None:
        return DEFAULT_NEGATIVE_TTL_SECONDS
    return NEGATIVE_TTL_BY_STATUS.get(status_code, DEFAULT_NEGATIVE_TTL_SECONDS)


def get_cache_key(path: str) -> str:
    return hashlib.sha256(path.encode('utf-8')).hexdigest()


def get_cache_dir(parent: str, path: str) -> Path:
    key = get_cache_key(path)
    return cache_path / parent / key[:2] / key[2:4]


def get_cache_base_path(parent: str, path: str) -> Path:
    return get_cache_dir(parent, path) / get_cache_key(path)


def get_cache_data_path(parent: str, path: str) -> Path:
    return get_cache_base_path(parent, path).with_suffix('.bin')


def get_cache_metadata_path(parent: str, path: str) -> Path:
    return get_cache_base_path(parent, path).with_suffix('.json')


def _ensure_parent_dir(target: Path):
    target.parent.mkdir(parents=True, exist_ok=True)


def _write_bytes_atomic(target: Path, content: bytes):
    _ensure_parent_dir(target)
    with tempfile.NamedTemporaryFile(dir=target.parent, delete=False) as temp_file:
        temp_file.write(content)
        temp_file.flush()
        os.fsync(temp_file.fileno())
        temp_path = Path(temp_file.name)
    os.replace(temp_path, target)


def _write_json_atomic(target: Path, payload: dict[str, Any]):
    _ensure_parent_dir(target)
    raw = json.dumps(payload, ensure_ascii=False, separators=(',', ':')).encode('utf-8')
    with tempfile.NamedTemporaryFile(dir=target.parent, delete=False) as temp_file:
        temp_file.write(raw)
        temp_file.flush()
        os.fsync(temp_file.fileno())
        temp_path = Path(temp_file.name)
    os.replace(temp_path, target)


def _read_metadata(metadata_path: Path) -> dict[str, Any] | None:
    if not metadata_path.exists():
        return None

    try:
        with metadata_path.open('r', encoding='utf-8') as file:
            payload = json.load(file)
        return payload if isinstance(payload, dict) else None
    except (OSError, json.JSONDecodeError):
        return None


def get_cache_lookup(parent: str, path: str) -> CacheLookup:
    data_path = get_cache_data_path(parent, path)
    metadata_path = get_cache_metadata_path(parent, path)
    metadata = _read_metadata(metadata_path)
    if metadata is None:
        return CacheLookup(status='missing', file_path=data_path, metadata_path=metadata_path)

    cache_status = metadata.get('status')
    expires_at = metadata.get('expires_at')
    if cache_status not in {'hit', 'negative'} or not isinstance(expires_at, int | float):
        return CacheLookup(status='missing', file_path=data_path, metadata_path=metadata_path)

    now = int(time.time())
    if cache_status == 'hit' and not data_path.exists():
        return CacheLookup(status='missing', file_path=data_path, metadata_path=metadata_path)

    status: LookupStatus = 'fresh' if int(expires_at) > now else 'expired'
    return CacheLookup(
        status=status,
        cache_status=cache_status,
        file_path=data_path,
        metadata_path=metadata_path,
        metadata=metadata,
    )


def write_success_cache(parent: str, path: str, content: bytes, content_type: str, ttl_seconds: int = IMAGE_SUCCESS_TTL_SECONDS):
    now = int(time.time())
    data_path = get_cache_data_path(parent, path)
    metadata_path = get_cache_metadata_path(parent, path)
    metadata = {
        'url': path,
        'status': 'hit',
        'content_type': content_type,
        'content_length': len(content),
        'created_at': now,
        'expires_at': now + ttl_seconds,
    }
    _write_bytes_atomic(data_path, content)
    _write_json_atomic(metadata_path, metadata)
    return metadata


def write_negative_cache(parent: str, path: str, error_code: int | None, ttl_seconds: int):
    now = int(time.time())
    data_path = get_cache_data_path(parent, path)
    metadata_path = get_cache_metadata_path(parent, path)
    if data_path.exists():
        data_path.unlink()
    _write_json_atomic(metadata_path, {
        'url': path,
        'status': 'negative',
        'error_code': error_code or 502,
        'created_at': now,
        'expires_at': now + ttl_seconds,
    })


def extend_cache_expiry(parent: str, path: str, ttl_seconds: int):
    metadata_path = get_cache_metadata_path(parent, path)
    metadata = _read_metadata(metadata_path)
    if not metadata:
        return

    now = int(time.time())
    metadata['expires_at'] = now + ttl_seconds
    _write_json_atomic(metadata_path, metadata)


def build_cache_etag(parent: str, path: str, metadata: dict[str, Any] | None) -> str | None:
    if not metadata:
        return None

    created_at = metadata.get('created_at')
    content_length = metadata.get('content_length', 0)
    if created_at is None:
        return None

    payload = f'{parent}:{get_cache_key(path)}:{created_at}:{content_length}'
    return f'"{hashlib.sha256(payload.encode("utf-8")).hexdigest()}"'


def cleanup_expired_cache(parents: tuple[str, ...] = CACHE_IMAGE_PARENTS) -> dict[str, int]:
    now = int(time.time())
    result = {
        'removed_metadata': 0,
        'removed_data': 0,
        'removed_dirs': 0,
    }

    for parent in parents:
        parent_path = cache_path / parent
        if not parent_path.exists():
            continue

        for metadata_path in parent_path.rglob('*.json'):
            base_path = metadata_path.with_suffix('')
            data_path = metadata_path.with_suffix('.bin')
            metadata = _read_metadata(metadata_path)

            if metadata is None:
                metadata_path.unlink(missing_ok=True)
                result['removed_metadata'] += 1
                if data_path.exists():
                    data_path.unlink(missing_ok=True)
                    result['removed_data'] += 1
                continue

            expires_at = metadata.get('expires_at')
            if not isinstance(expires_at, (int, float)):
                metadata_path.unlink(missing_ok=True)
                result['removed_metadata'] += 1
                if data_path.exists():
                    data_path.unlink(missing_ok=True)
                    result['removed_data'] += 1
                continue

            cache_status = metadata.get('status')
            expires_at = int(expires_at)
            should_remove = False
            if cache_status == 'negative':
                should_remove = expires_at <= now
            elif cache_status == 'hit':
                should_remove = (expires_at + IMAGE_RETENTION_SECONDS) <= now
            else:
                should_remove = True

            if should_remove:
                metadata_path.unlink(missing_ok=True)
                result['removed_metadata'] += 1
                if data_path.exists():
                    data_path.unlink(missing_ok=True)
                    result['removed_data'] += 1
                continue

            if metadata.get('status') == 'hit' and not data_path.exists():
                metadata_path.unlink(missing_ok=True)
                result['removed_metadata'] += 1

        for data_path in parent_path.rglob('*.bin'):
            metadata_path = data_path.with_suffix('.json')
            if not metadata_path.exists():
                data_path.unlink(missing_ok=True)
                result['removed_data'] += 1

        for dir_path in sorted(parent_path.rglob('*'), reverse=True):
            if dir_path.is_dir() and not any(dir_path.iterdir()):
                dir_path.rmdir()
                result['removed_dirs'] += 1

    return result
