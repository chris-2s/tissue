import io
import os

from PIL import Image
from urllib.parse import urlparse
from . import badge
from ...schema import PosterCrop, VideoDetail


def _cover_extension(video: VideoDetail, fanart: Image.Image) -> str:
    extension = os.path.splitext(urlparse(video.cover or '').path)[-1].lower()
    if extension in {'.jpg', '.jpeg', '.png', '.webp'}:
        return extension

    return _image_extension(fanart)


def _image_extension(image: Image.Image, fallback: str = '.jpg') -> str:
    return {
        'JPEG': '.jpg',
        'PNG': '.png',
        'WEBP': '.webp',
    }.get(image.format or '', fallback)


def _prepare_for_extension(image: Image.Image, extension: str) -> Image.Image:
    if extension in {'.jpg', '.jpeg'} and image.mode not in {'RGB', 'L'}:
        return image.convert('RGB')
    return image


def crop_poster(image: Image.Image, crop: PosterCrop) -> Image.Image:
    width, height = image.size
    left = min(width - 1, max(0, round(width * crop.x / 100)))
    top = min(height - 1, max(0, round(height * crop.y / 100)))
    right = min(width, max(left + 1, round(width * (crop.x + crop.width) / 100)))
    bottom = min(height, max(top + 1, round(height * (crop.y + crop.height) / 100)))
    return image.crop((left, top, right, bottom))


def get_right_poster_crop(image: Image.Image) -> PosterCrop:
    poster_aspect_ratio = 379 / 538
    image_aspect_ratio = image.width / image.height

    if image_aspect_ratio >= poster_aspect_ratio:
        width = poster_aspect_ratio / image_aspect_ratio * 100
        return PosterCrop(x=100 - width, y=0, width=width, height=100)

    height = image_aspect_ratio / poster_aspect_ratio * 100
    return PosterCrop(x=0, y=(100 - height) / 2, width=100, height=height)


def save_images(
    video: VideoDetail,
    video_path: str,
    cover_data: bytes,
):
    fanart = Image.open(io.BytesIO(cover_data))
    fanart.load()
    extension = _cover_extension(video, fanart)
    poster_crop = video.poster_crop or get_right_poster_crop(fanart)
    video.poster_crop = poster_crop
    poster = badge.tags(crop_poster(fanart, poster_crop), video.is_zh, video.is_uncensored)
    thumb = badge.tags(fanart, video.is_zh, video.is_uncensored)

    save_path, _ = os.path.splitext(video_path)
    fanart_path = save_path + f"-fanart{extension}"
    poster_path = save_path + f"-poster{extension}"
    thumb_path = save_path + f"-thumb{extension}"

    with open(fanart_path, "wb") as f:
        f.write(cover_data)
    _prepare_for_extension(poster, extension).save(
        poster_path, quality=95, subsampling=0, optimize=True
    )
    _prepare_for_extension(thumb, extension).save(
        thumb_path, quality=95, subsampling=0, optimize=True
    )

    video.fanart = fanart_path
    video.poster = poster_path
    video.thumb = thumb_path
