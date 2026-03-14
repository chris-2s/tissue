import hashlib
import re
from urllib.parse import urlparse
from typing import Optional

import requests
from curl_cffi import requests as curl_requests  # type: ignore[import-not-found]
from cachetools import cached, TTLCache
from fastapi import APIRouter, Response, Request, Depends
from fastapi.responses import StreamingResponse
from starlette.concurrency import run_in_threadpool

from app.db import get_db
from app.schema.r import R
from app.service.spider import SpiderService
from app.utils.logger import logger
from app.utils.m3u8 import fix_m3u8_paths, is_m3u8
from app.utils.spider.spider import DEFAULT_IMPERSONATE
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


def build_proxy_headers(request: Request, url: str) -> dict[str, str]:
    headers: dict[str, str] = {}
    range_header = request.headers.get("Range")
    user_agent = request.headers.get("User-Agent")
    referer = request.headers.get("Referer")

    if range_header:
        headers["Range"] = range_header
    if user_agent:
        headers["User-Agent"] = user_agent
    if referer:
        headers["Referer"] = referer
    else:
        parsed = urlparse(url)
        if parsed.scheme and parsed.netloc:
            headers["Referer"] = f"{parsed.scheme}://{parsed.netloc}/"
    return headers


def fetch_m3u8_via_cffi(url: str, headers: dict[str, str], cookie_str: str | None) -> tuple[str, dict[str, str]]:
    request_headers = {k: v for k, v in headers.items() if k.lower() != "range"}
    if cookie_str:
        request_headers["Cookie"] = cookie_str

    response = curl_requests.get(
        url,
        headers=request_headers,
        timeout=30,
        allow_redirects=True,
        impersonate=DEFAULT_IMPERSONATE,
    )
    response.raise_for_status()
    return response.text, dict(response.headers)


def stream_binary_via_cffi(url: str, headers: dict[str, str], cookie_str: str | None):
    request_headers = dict(headers)
    if cookie_str:
        request_headers["Cookie"] = cookie_str

    response = curl_requests.get(
        url,
        headers=request_headers,
        timeout=(5, 60),
        allow_redirects=True,
        stream=True,
        impersonate=DEFAULT_IMPERSONATE,
    )

    if response.status_code == 416 and request_headers.get("Range"):
        logger.warning("上游返回 416，尝试不带 Range 重试: %s", url)
        response.close()
        retry_headers = {k: v for k, v in request_headers.items() if k.lower() != "range"}
        response = curl_requests.get(
            url,
            headers=retry_headers,
            timeout=(5, 60),
            allow_redirects=True,
            stream=True,
            impersonate=DEFAULT_IMPERSONATE,
        )

    response.raise_for_status()
    status_code = response.status_code
    response_headers = dict(response.headers)

    def body_generator():
        try:
            for chunk in response.iter_content(chunk_size=64 * 1024):
                if chunk:
                    yield chunk
        finally:
            response.close()

    return status_code, response_headers, body_generator()


@router.get("/trailer")
async def proxy_video_trailer(url: str, request: Request, db=Depends(get_db), base_url: Optional[str] = None):
    headers = build_proxy_headers(request, url)

    spider_service = SpiderService(db)
    cookie_str = spider_service.get_cookies_by_url(url)

    if is_m3u8(url):
        try:
            m3u8_text, upstream_headers = await run_in_threadpool(fetch_m3u8_via_cffi, url, headers, cookie_str)
        except Exception as exc:
            status_code = getattr(getattr(exc, 'response', None), 'status_code', 502)
            logger.warning("代理 m3u8 失败: %s %s", status_code, url)
            return Response(status_code=status_code)

        effective_base_url = base_url or str(request.base_url).rstrip("/")
        m3u8_content = fix_m3u8_paths(m3u8_text, url, effective_base_url)
        media_type = upstream_headers.get("content-type", "application/vnd.apple.mpegurl")
        return Response(content=m3u8_content.encode('utf-8'), media_type=media_type)

    try:
        status_code, response_headers, body = await run_in_threadpool(stream_binary_via_cffi, url, headers, cookie_str)
    except Exception as exc:
        status_code = getattr(getattr(exc, 'response', None), 'status_code', 502)
        logger.warning("代理视频流失败: %s %s", status_code, url)
        return Response(status_code=status_code)

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

    return StreamingResponse(
        body,
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
