import hashlib
import re

import httpx
import requests
from cachetools import cached, TTLCache
from fastapi import APIRouter, Response, Request
from fastapi.responses import StreamingResponse

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


@router.get("/trailer")
async def proxy_video_trailer(url: str, request: Request):
    headers = {
        "Range": request.headers.get("Range", ""),
        "User-Agent": request.headers.get("User-Agent")
    }

    async with httpx.AsyncClient() as client:
        if url.startswith("//"):
            url = 'http:' + url
        response = await client.get(url, headers=headers)
        response.raise_for_status()

        async def video_stream():
            async for chunk in response.aiter_bytes(1024 * 1024):
                yield chunk

        return StreamingResponse(
            video_stream(),
            status_code=response.status_code,
            headers=dict(response.headers)
        )


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
