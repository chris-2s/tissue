import requests
import numpy as np
import cv2 as cv
import os

from urllib.parse import urlparse
from . import cutter, badge
from .. import spider
from ...schema import VideoDetail


def save_images(video: VideoDetail, video_path: str):
    path = urlparse(video.cover).path
    file_name = os.path.basename(path)
    extension = os.path.splitext(file_name)[-1]

    poster_data = spider.get_video_cover(video.cover)
    buf = np.asarray(bytearray(poster_data), dtype="uint8")
    fanart = cv.imdecode(buf, cv.IMREAD_COLOR)

    poster_image = cutter.cut(fanart)
    poster = badge.tags(poster_image, video.is_zh, video.is_uncensored)
    thumb = badge.tags(fanart, video.is_zh, video.is_uncensored)

    save_path, _ = os.path.splitext(video_path)

    cv.imwrite(save_path + f"-fanart{extension}", fanart)
    cv.imwrite(save_path + f"-poster{extension}", poster)
    cv.imwrite(save_path + f"-thumb{extension}", thumb)

    return extension
