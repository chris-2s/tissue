import time
from pathlib import Path

import tailer
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from app.schema.r import R
from app.service.spider import get_spider_service

router = APIRouter()


@router.get('/ranking')
def get_rankings(site_id: int, video_type: str, cycle: str, service=Depends(get_spider_service)):
    return service.get_ranking(site_id, video_type, cycle)


@router.get('/detail')
def get_detail(site_id: int, num: str, url: str, service=Depends(get_spider_service)):
    return service.get_detail(site_id, num, url)


@router.get('/actor')
def get_actor(site_id: int, code: str, page: int = 1, service=Depends(get_spider_service)):
    return R.pages(service.get_actor(site_id, code, page))


@router.get('/log')
async def get_logs():
    log_path = Path(f'{Path(__file__).cwd()}/config/app.log')

    def log_generator():
        with open(log_path, 'r', encoding='utf-8') as f:
            for line in f.readlines()[-50:]:
                yield 'data: %s\n\n' % line
        while True:
            for t in tailer.follow(open(log_path, 'r', encoding='utf-8')):
                yield 'data: %s\n\n' % (t or '')
            time.sleep(1)

    return StreamingResponse(log_generator(), media_type="text/event-stream")
