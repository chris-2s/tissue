import hashlib
import re

import requests
from cachetools import cached, TTLCache
from fastapi import APIRouter, Response, Request, Depends
from fastapi.responses import FileResponse

from app.schema.r import R
from app.service.resource import ImageCacheType, ResourceService, get_resource_service
from version import APP_VERSION

router = APIRouter()


@router.get("/image")
def proxy_image(url: str, request: Request, image_type: ImageCacheType = 'cover'):
    image = ResourceService.fetch_image_file(url, image_type)
    if image.file_path:
        if image.etag and request.headers.get('if-none-match') == image.etag:
            return Response(
                status_code=304,
                headers={
                    'Cache-Control': f'public, max-age={ResourceService.IMAGE_CLIENT_CACHE_MAX_AGE_SECONDS}',
                    'ETag': image.etag,
                }
            )
        headers = {
            'Cache-Control': f'public, max-age={ResourceService.IMAGE_CLIENT_CACHE_MAX_AGE_SECONDS}',
            'ETag': image.etag or hashlib.md5(f'{image_type}:{url}'.encode()).hexdigest(),
        }
        return FileResponse(path=image.file_path, media_type=image.media_type, headers=headers)

    return Response(
        status_code=image.status_code,
        headers={
            'Cache-Control': 'no-cache',
        }
    )


@router.get("/trailer")
async def proxy_video_trailer(
    url: str,
    request: Request,
    base_url: str | None = None,
    resource_service=Depends(get_resource_service),
):
    return await resource_service.proxy_trailer(url, request, base_url=base_url)


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
