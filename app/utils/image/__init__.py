import io
import os

from PIL import Image
from urllib.parse import urlparse
from . import cutter, badge
from ...schema import VideoDetail


def save_images(video: VideoDetail, video_path: str, cover_data: bytes):
    path = urlparse(video.cover).path
    file_name = os.path.basename(path)
    extension = os.path.splitext(file_name)[-1]

    fanart = Image.open(io.BytesIO(cover_data))

    poster_image = cutter.cut(fanart)
    poster = badge.tags(poster_image, video.is_zh, video.is_uncensored)
    thumb = badge.tags(fanart, video.is_zh, video.is_uncensored)

    save_path, _ = os.path.splitext(video_path)

    with open(save_path + f"-fanart{extension}", "wb") as f:
        f.write(cover_data)
    poster.save(save_path + f"-poster{extension}", quality=95, subsampling=0, optimize=True)
    thumb.save(save_path + f"-thumb{extension}", quality=95, subsampling=0, optimize=True)

    return extension
