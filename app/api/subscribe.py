from typing import List, Optional

from fastapi import APIRouter, Depends

from app import schema
from app.schema.r import R
from app.service.subscribe import get_subscribe_service

router = APIRouter()


@router.get('/', response_model=R[List[schema.Subscribe]])
def get_subscribes(service=Depends(get_subscribe_service)):
    subscribes = service.get_subscribes()
    return R.list(subscribes)


@router.post('/')
def add_subscribe(subscribe: schema.SubscribeCreate, service=Depends(get_subscribe_service)):
    service.add_subscribe(subscribe)
    return R.ok()


@router.put('/')
def update_subscribe(subscribe: schema.SubscribeUpdate, service=Depends(get_subscribe_service)):
    service.update_subscribe(subscribe)
    return R.ok()


@router.delete('/')
def delete_subscribe(subscribe_id: int, service=Depends(get_subscribe_service)):
    service.delete_subscribe(subscribe_id)
    return R.ok()


@router.get('/search', response_model=R[schema.VideoDetail])
def search_video(num: str, service=Depends(get_subscribe_service)):
    videos = service.search_video(num)
    return R.list(videos)


@router.post('/download')
def download_video(video: schema.SubscribeCreate, link: schema.VideoDownload, service=Depends(get_subscribe_service)):
    service.download_video_manual(video, link)
    return R.ok()
