from typing import Optional

from fastapi import APIRouter, Depends

from app.schema import VideoDetail
from app.schema.r import R
from app.service.video import get_video_service

router = APIRouter()


@router.get('/')
def get_videos(force: Optional[bool] = False, service=Depends(get_video_service)):
    if force:
        video = service.get_videos_force()
    else:
        video = service.get_videos()
    return R.list(video)


@router.get('/detail')
def get_video(path: str, service=Depends(get_video_service)):
    video = service.get_video(path)
    return R.ok(video)


@router.get('/parse')
def parse_video(path: str, service=Depends(get_video_service)):
    video = service.parse_video(path)
    return R.ok(video)


@router.get('/scrape')
def scrape_video(num: str, service=Depends(get_video_service)):
    video = service.scrape_video(num)
    return R.ok(video)


@router.post('/')
def save_video(video: VideoDetail,
               mode: Optional[str] = None,
               trans_mode: Optional[str] = None,
               service=Depends(get_video_service)):
    service.save_video(video, mode, trans_mode)
    return R.ok()


@router.delete('/')
def delete_video(path: str, service=Depends(get_video_service)):
    service.delete_video(path)
    return R.ok()
