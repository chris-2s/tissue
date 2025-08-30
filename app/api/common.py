import hashlib
import re

import httpx
import requests
from cachetools import cached, TTLCache
from fastapi import APIRouter, Response, Request
from fastapi.responses import StreamingResponse

from app.schema.r import R
from app.service.spider import SpiderService
from version import APP_VERSION

router = APIRouter()


@router.get("/cover")
def proxy_video_cover(url: str):
    cover = SpiderService.get_video_cover(url)
    if cover:
        headers = {
            'Cache-Control': 'public, max-age=31536000',
            'ETag': hashlib.md5(url.encode()).hexdigest(),
        }
    else:
        headers = {
            'Cache-Control': 'no-cache',
        }
    return Response(content=cover, media_type="image", headers=headers)


async def advanced_stream_generator(url: str, headers: dict):
    async with httpx.AsyncClient() as client:
        async with client.stream("GET", url, headers=headers, timeout=None) as response:
            response.raise_for_status()
            yield {
                "status_code": response.status_code,
                "headers": dict(response.headers)
            }
            async for chunk in response.aiter_bytes():
                yield chunk


@router.get("/trailer")
async def proxy_video_trailer(url: str, request: Request):
    headers = {
        "Range": request.headers.get("Range", ""),
        "User-Agent": request.headers.get("User-Agent")
    }

    if url.startswith("//"):
        url = 'http:' + url

    generator = advanced_stream_generator(url, headers)
    try:
        metadata = await generator.__anext__()
        status_code = metadata["status_code"]
        response_headers = metadata["headers"]
    except StopAsyncIteration:
        return Response(status_code=204)

    return StreamingResponse(
        generator,
        status_code=status_code,
        headers=response_headers
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
