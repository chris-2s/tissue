import hashlib
import re
from typing import Optional

import httpx
import requests
from cachetools import cached, TTLCache
from fastapi import APIRouter, Response, Request, Depends
from fastapi.responses import StreamingResponse

from app.db import get_db
from app.schema.r import R
from app.service.spider import SpiderService
from app.utils.cookies import cookie_header_to_httpx_dict
from app.utils.m3u8 import fix_m3u8_paths, is_m3u8
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


async def advanced_stream_generator(url: str, headers: dict, cookies: str | None = None):
    async with httpx.AsyncClient() as client:
        async with client.stream("GET", url, headers=headers, cookies=cookie_header_to_httpx_dict(cookies),
                                 timeout=None) as response:
            response.raise_for_status()
            yield {
                "status_code": response.status_code,
                "headers": dict(response.headers),
            }
            async for chunk in response.aiter_bytes():
                yield chunk


@router.get("/trailer")
async def proxy_video_trailer(url: str, request: Request, db=Depends(get_db), base_url: Optional[str] = None):
    headers = {
        "Range": request.headers.get("Range", ""),
        "User-Agent": request.headers.get("User-Agent"),
    }

    spider_service = SpiderService(db)
    cookie_str = spider_service.get_cookies_by_url(url)

    generator = advanced_stream_generator(url, headers, cookie_str)
    try:
        metadata = await generator.__anext__()
        status_code = metadata["status_code"]
        response_headers = metadata["headers"]
    except StopAsyncIteration:
        return Response(status_code=204)

    content_type = response_headers.get("content-type", "")

    if is_m3u8(url, content_type):
        content = b''
        async for chunk in generator:
            content += chunk
        m3u8_content = fix_m3u8_paths(content.decode('utf-8'), url, base_url)
        return Response(content=m3u8_content.encode('utf-8'), media_type='application/vnd.apple.mpegurl')

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
