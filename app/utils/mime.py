import mimetypes
from pathlib import PurePosixPath
from urllib.parse import unquote, urlparse


IMAGE_MIME_BY_EXTENSION = {
    '.avif': 'image/avif',
    '.bmp': 'image/bmp',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon',
    '.jpeg': 'image/jpeg',
    '.jpg': 'image/jpeg',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.tif': 'image/tiff',
    '.tiff': 'image/tiff',
    '.webp': 'image/webp',
}


def detect_image_mime(content: bytes | None = None, filename: str | None = None) -> str:
    if filename:
        parsed = urlparse(filename)
        path = unquote(parsed.path or filename)
        extension = PurePosixPath(path).suffix.lower()
        media_type = IMAGE_MIME_BY_EXTENSION.get(extension)
        if not media_type:
            media_type, _ = mimetypes.guess_type(path)
        if media_type and media_type.startswith('image/'):
            return media_type

    if content:
        if content.startswith(b'\xff\xd8\xff'):
            return 'image/jpeg'
        if content.startswith(b'\x89PNG\r\n\x1a\n'):
            return 'image/png'
        if content.startswith((b'GIF87a', b'GIF89a')):
            return 'image/gif'
        if content.startswith(b'BM'):
            return 'image/bmp'
        if len(content) >= 12 and content.startswith(b'RIFF') and content[8:12] == b'WEBP':
            return 'image/webp'
        if len(content) >= 12 and content[4:8] == b'ftyp':
            if content[8:12] in {b'avif', b'avis'}:
                return 'image/avif'
    return 'application/octet-stream'
