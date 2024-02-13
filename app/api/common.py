from fastapi import APIRouter, Response

from app.utils import spider

router = APIRouter()


@router.get("/cover")
def proxy_video_cover(url: str):
    cover = spider.get_video_cover(url)
    return Response(content=cover, media_type="image")
