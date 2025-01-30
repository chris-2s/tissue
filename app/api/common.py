import hashlib

from fastapi import APIRouter, Response

from app.utils import spider

router = APIRouter()


@router.get("/cover")
def proxy_video_cover(url: str):
    cover = spider.get_video_cover(url)
    headers = {
        'Cache-Control': 'public, max-age=31536000',
        'ETag': hashlib.md5(url.encode()).hexdigest(),
    }
    return Response(content=cover, media_type="image", headers=headers)
