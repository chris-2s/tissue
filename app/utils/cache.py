import os.path
import hashlib
from pathlib import Path

cache_path = Path(f'{Path(__file__).cwd()}/config/cache')


def get_cache_path(parent: str, path: str):
    md = hashlib.md5()
    md.update(path.encode("utf-8"))
    return os.path.join(cache_path, parent, md.hexdigest())


def cache_file(parent: str, path: str, content: bytes):
    cache_file_path = get_cache_path(parent, path)

    folder = os.path.abspath(os.path.join(cache_file_path, '..'))
    if not os.path.exists(folder):
        os.makedirs(folder)

    with open(cache_file_path, 'wb') as file:
        file.write(content)


def get_cache_file(parent: str, path: str):
    cache_file_path = get_cache_path(parent, path)
    if os.path.exists(cache_file_path):
        with open(cache_file_path, 'rb') as file:
            return file.read()


def clean_cache_file(parent: str, path: str):
    cache_file_path = get_cache_path(parent, path)
    if os.path.exists(cache_file_path):
        os.remove(cache_file_path)
