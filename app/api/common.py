import hashlib
import re

import requests
from cachetools import cached, TTLCache
from fastapi import APIRouter, Response

from app.schema.r import R
from app.utils import spider
from version import APP_VERSION

router = APIRouter()


@router.get("/cover")
def proxy_video_cover(url: str):
    cover = spider.get_video_cover(url)
    headers = {
        'Cache-Control': 'public, max-age=31536000',
        'ETag': hashlib.md5(url.encode()).hexdigest(),
    }
    return Response(content=cover, media_type="image", headers=headers)


@router.get("/version")
@cached(cache=TTLCache(maxsize=1, ttl=3600))
def get_versions():
    current = APP_VERSION[1:]

    response = requests.get("https://raw.githubusercontent.com/chris-2s/tissue/refs/heads/main/version.py", timeout=10)
    latest = re.match(r"APP_VERSION = 'v(.+?)'", response.text).group(1)

    return R.ok({
        "current": current,
        "latest": latest,
    })
