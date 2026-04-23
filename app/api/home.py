import time
from pathlib import Path

import tailer
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from app.exception import BizException
from app.schema import Setting
from app.schema.r import R
from app.service.spider import get_spider_service
from app.utils.qbittorent import qbittorent

router = APIRouter()


@router.get('/ranking')
def get_rankings(site_id: int, video_type: str, cycle: str, service=Depends(get_spider_service)):
    return service.get_ranking(site_id, video_type, cycle)


@router.get('/cover')
def get_cover(site_id: int, num: str, url: str, service=Depends(get_spider_service)):
    spider = service.build_spider_by_site_id(site_id)
    if not spider or not hasattr(spider, 'get_info'):
        return R.ok({'cover': None})
    try:
        info = spider.get_info(num, url, include_downloads=False, include_previews=False)
        return R.ok({'cover': info.cover})
    except Exception:
        return R.ok({'cover': None})


@router.get('/detail')
def get_detail(site_id: int, num: str, url: str, service=Depends(get_spider_service)):
    return service.get_detail(site_id, num, url)


@router.get('/actor')
def get_actor(site_id: int, code: str, page: int = 1, service=Depends(get_spider_service)):
    return R.pages(service.get_actor(site_id, code, page))


@router.post('/torrent-download')
def download_torrent(site_id: int, torrent_id: str, service=Depends(get_spider_service)):
    spider = service.build_spider_by_site_id(site_id)
    if not spider or not hasattr(spider, 'download_torrent_file'):
        raise BizException('该站点不支持种子下载')

    torrent_data = spider.download_torrent_file(torrent_id)
    if not torrent_data:
        raise BizException('种子下载失败，请检查登录状态')

    setting = Setting()
    path = setting.download.download_path
    category = setting.download.category or None

    response = qbittorent.add_torrent_file(torrent_data, path, category)
    if response.status_code != 200:
        raise BizException('发送到下载器失败')

    return R.ok()


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
