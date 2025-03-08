import time
from pathlib import Path

import tailer
from fastapi import APIRouter

from fastapi.responses import StreamingResponse
from app.utils import spider

router = APIRouter()


@router.get('/ranking')
def get_rankings(source: str, video_type: str, cycle: str):
    if source == 'JavDB':
        return spider.JavdbSpider().get_ranking(video_type, cycle)


@router.get('/ranking/detail')
def get_ranking_detail(source: str, num: str, url: str):
    if source == 'JavDB':
        return spider.JavdbSpider().get_info(num, url=url, include_downloads=True)


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
