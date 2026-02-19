import hashlib
import re
from typing import Any, Optional

import httpx
import requests
from cachetools import cached, TTLCache
from fastapi import APIRouter, Response, Request, Depends
from fastapi.responses import StreamingResponse

from app.db import get_db
from app.schema.r import R
from app.service.spider import SpiderService
from app.utils.cookies import cookie_header_to_httpx_dict
from app.utils.logger import logger
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
        request_kwargs = {
            "cookies": cookie_header_to_httpx_dict(cookies),
            "timeout": None,
        }

        async with client.stream("GET", url, headers=headers, **request_kwargs) as response:
            range_header = headers.get("Range")
            if response.status_code == 416 and range_header:
                logger.warning("上游返回 416，尝试不带 Range 重试: %s", url)
            else:
                response.raise_for_status()
                yield {
                    "status_code": response.status_code,
                    "headers": dict(response.headers),
                }
                async for chunk in response.aiter_bytes():
                    yield chunk
                return

        retry_headers = {k: v for k, v in headers.items() if k.lower() != "range"}
        async with client.stream("GET", url, headers=retry_headers, **request_kwargs) as response:
            response.raise_for_status()
            yield {
                "status_code": response.status_code,
                "headers": dict(response.headers),
            }
            async for chunk in response.aiter_bytes():
                yield chunk


@router.get("/trailer")
async def proxy_video_trailer(url: str, request: Request, db=Depends(get_db), base_url: Optional[str] = None):
    headers = {}
    range_header = request.headers.get("Range")
    user_agent = request.headers.get("User-Agent")

    if range_header:
        headers["Range"] = range_header
    if user_agent:
        headers["User-Agent"] = user_agent

    spider_service = SpiderService(db)
    cookie_str = spider_service.get_cookies_by_url(url)

    generator = advanced_stream_generator(url, headers, cookie_str)
    try:
        metadata = await generator.__anext__()
        if not isinstance(metadata, dict):
            logger.warning("代理视频流元数据异常: %s", url)
            return Response(status_code=502)
        status_code = int(metadata.get("status_code", 200))
        response_headers: dict[str, str] = metadata.get("headers", {})
    except httpx.HTTPStatusError as exc:
        logger.warning("代理视频流失败: %s %s", exc.response.status_code, url)
        return Response(status_code=exc.response.status_code)
    except httpx.RequestError:
        logger.warning("代理视频流网络错误: %s", url)
        return Response(status_code=502)
    except StopAsyncIteration:
        return Response(status_code=204)

    excluded_headers = {
        "connection",
        "keep-alive",
        "proxy-authenticate",
        "proxy-authorization",
        "te",
        "trailers",
        "transfer-encoding",
        "upgrade",
    }
    response_headers = {
        k: v for k, v in response_headers.items() if k.lower() not in excluded_headers
    }

    content_type = response_headers.get("content-type", "")

    if is_m3u8(url, content_type):
        content = b''
        async for chunk in generator:
            if isinstance(chunk, bytes):
                content += chunk
        effective_base_url = base_url or str(request.base_url).rstrip("/")
        m3u8_content = fix_m3u8_paths(content.decode('utf-8'), url, effective_base_url)
        return Response(content=m3u8_content.encode('utf-8'), media_type='application/vnd.apple.mpegurl')

    async def body_generator():
        async for chunk in generator:
            if isinstance(chunk, bytes):
                yield chunk

    return StreamingResponse(
        body_generator(),
        status_code=status_code,
        headers=response_headers
    )


@router.get("/version")
@cached(cache=TTLCache(maxsize=1, ttl=3600))
def get_versions():
    current = APP_VERSION[1:]

    response = requests.get("https://raw.githubusercontent.com/chris-2s/tissue/refs/heads/main/version.py", timeout=10)
    match = re.match(r"APP_VERSION = 'v(.+?)'", response.text)
    latest = match.group(1) if match else current

    return R.ok({
        "current": current,
        "latest": latest,
    })
