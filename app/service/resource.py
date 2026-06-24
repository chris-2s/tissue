import hashlib
import mimetypes
from pathlib import Path
from dataclasses import dataclass
from typing import Literal, Optional
from urllib.parse import urlparse

from curl_cffi import requests as curl_requests  # type: ignore[import-not-found]
from fastapi import Depends, Request, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from starlette.concurrency import run_in_threadpool

from app.db import get_db
from app.db.models import Site
from app.schema import Setting
from app.service.base import BaseService
from app.service.spider import SpiderService
from app.utils import cache
from app.utils.logger import logger
from app.utils.m3u8 import fix_m3u8_paths, is_m3u8
from app.utils.spider import JavDBSpider
from app.utils.spider.spider import DEFAULT_IMPERSONATE, Spider


ImageCacheType = Literal['cover', 'avatar', 'preview']


@dataclass(slots=True)
class ImageResult:
    file_path: str | None
    media_type: str | None
    status_code: int
    etag: str | None = None


def get_resource_service(db: Session = Depends(get_db)):
    return ResourceService(db=db)


class ResourceService(BaseService):
    IMAGE_CLIENT_CACHE_MAX_AGE_SECONDS = 24 * 60 * 60
    LOCAL_IMAGE_SUFFIXES = {'.jpg', '.jpeg', '.png', '.webp', '.gif'}

    @classmethod
    def is_remote_image(cls, url: str) -> bool:
        component = urlparse(url)
        return component.scheme in {'http', 'https'}

    @classmethod
    def fetch_local_image_file(cls, path: str) -> ImageResult:
        try:
            target_path = Path(path).expanduser().resolve(strict=True)
        except OSError:
            return ImageResult(file_path=None, media_type=None, status_code=404)

        if not target_path.is_file():
            return ImageResult(file_path=None, media_type=None, status_code=404)

        if target_path.suffix.lower() not in cls.LOCAL_IMAGE_SUFFIXES:
            return ImageResult(file_path=None, media_type=None, status_code=404)

        video_root = Path(Setting().app.video_path).expanduser().resolve()
        try:
            target_path.relative_to(video_root)
        except ValueError:
            return ImageResult(file_path=None, media_type=None, status_code=403)

        media_type = mimetypes.guess_type(target_path.name)[0] or 'application/octet-stream'
        stat = target_path.stat()
        etag = f'"{hashlib.sha256(f"{target_path}:{int(stat.st_mtime)}:{stat.st_size}".encode("utf-8")).hexdigest()}"'
        return ImageResult(file_path=str(target_path), media_type=media_type, status_code=200, etag=etag)

    @staticmethod
    def fetch_image_file(url: str, image_type: ImageCacheType) -> ImageResult:
        component = urlparse(url)
        lookup = cache.get_cache_lookup(image_type, url)
        stale_path = None
        stale_media_type = None
        stale_etag = None
        if lookup.cache_status == 'hit' and lookup.file_path is not None and lookup.metadata:
            stale_path = str(lookup.file_path)
            stale_media_type = lookup.metadata.get('content_type') or 'application/octet-stream'
            stale_etag = cache.build_cache_etag(image_type, url, lookup.metadata)
            if lookup.status == 'fresh':
                return ImageResult(
                    file_path=stale_path,
                    media_type=stale_media_type,
                    status_code=200,
                    etag=stale_etag,
                )
        elif lookup.cache_status == 'negative' and lookup.status == 'fresh':
            error_code = lookup.metadata.get('error_code') if lookup.metadata else 502
            return ImageResult(file_path=None, media_type=None, status_code=error_code or 502)

        match component.hostname:
            case 'c0.jdbstatic.com':
                status_code, response, content_type = JavDBSpider.fetch_cover(url)
            case _:
                status_code, response, content_type = Spider.fetch_cover(url)

        if response:
            media_type = content_type or 'application/octet-stream'
            metadata = cache.write_success_cache(image_type, url, response, media_type)
            return ImageResult(
                file_path=str(cache.get_cache_data_path(image_type, url)),
                media_type=media_type,
                status_code=200,
                etag=cache.build_cache_etag(image_type, url, metadata),
            )

        if stale_path is not None:
            cache.extend_cache_expiry(image_type, url, cache.get_stale_fallback_ttl_seconds(image_type))
            return ImageResult(
                file_path=stale_path,
                media_type=stale_media_type,
                status_code=200,
                etag=stale_etag,
            )

        cache.write_negative_cache(image_type, url, status_code, cache.get_negative_ttl_seconds(status_code))
        return ImageResult(file_path=None, media_type=None, status_code=status_code or 502)

    @staticmethod
    def fetch_image_bytes(url: str | None, image_type: ImageCacheType) -> bytes | None:
        if not url:
            return None

        image = ResourceService.fetch_image_file(url, image_type)
        if not image.file_path:
            return None

        try:
            with open(image.file_path, 'rb') as file:
                return file.read()
        except OSError:
            return None

    @staticmethod
    def _build_proxy_headers(request: Request, url: str) -> dict[str, str]:
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

    @staticmethod
    def _fetch_m3u8_via_cffi(url: str, headers: dict[str, str], cookie_str: str | None) -> tuple[str, dict[str, str]]:
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

    @staticmethod
    def _stream_binary_via_cffi(url: str, headers: dict[str, str], cookie_str: str | None):
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

    def _get_cookies_by_url(self, url: str) -> str | None:
        parsed = urlparse(url)
        host = parsed.netloc
        sites = self.db.query(Site).all()

        for site in sites:
            spider_class = SpiderService.get_spider_class(site.spider_key)
            if not spider_class or not spider_class.origin_host:
                continue

            origin_parsed = urlparse(site.alternate_host or spider_class.origin_host)
            origin_domain = origin_parsed.netloc.lstrip('www.')
            if host.endswith(origin_domain) or origin_domain.endswith(host):
                return site.cookies

        return None

    async def _proxy_hls_trailer(
            self,
            url: str,
            headers: dict[str, str],
            cookie_str: str | None,
            request: Request,
            base_url: str | None,
    ) -> Response:
        try:
            m3u8_text, upstream_headers = await run_in_threadpool(self._fetch_m3u8_via_cffi, url, headers, cookie_str)
        except Exception as exc:
            status_code = getattr(getattr(exc, 'response', None), 'status_code', 502)
            logger.warning("代理 m3u8 失败: %s %s", status_code, url)
            return Response(status_code=status_code)

        effective_base_url = base_url or str(request.base_url).rstrip("/")
        m3u8_content = fix_m3u8_paths(m3u8_text, url, effective_base_url)
        media_type = upstream_headers.get("content-type", "application/vnd.apple.mpegurl")
        return Response(content=m3u8_content.encode('utf-8'), media_type=media_type)

    async def _proxy_binary_trailer(
            self,
            url: str,
            headers: dict[str, str],
            cookie_str: str | None,
    ) -> Response | StreamingResponse:
        try:
            status_code, response_headers, body = await run_in_threadpool(self._stream_binary_via_cffi, url, headers,
                                                                          cookie_str)
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

    async def proxy_trailer(self, url: str, request: Request, base_url: Optional[str] = None) -> Response | StreamingResponse:
        headers = self._build_proxy_headers(request, url)
        cookie_str = self._get_cookies_by_url(url)

        if is_m3u8(url):
            return await self._proxy_hls_trailer(url, headers, cookie_str, request, base_url)

        return await self._proxy_binary_trailer(url, headers, cookie_str)

    @classmethod
    def job_clean_cache(cls):
        result = cache.cleanup_expired_cache()
        logger.info(
            f"图片缓存清理完成，删除元数据 {result['removed_metadata']} 个，"
            f"删除数据文件 {result['removed_data']} 个，删除空目录 {result['removed_dirs']} 个"
        )
