import asyncio
import os
from pathlib import Path

from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse

from app import schema
from app.schema.home import SiteVideo
from app.schema.r import R
from app.service.spider import get_spider_service
from app.utils.log_stream import build_log_event, format_sse, read_last_lines

router = APIRouter()


@router.get('/ranking')
def get_rankings(site_id: int, video_type: str, cycle: str, service=Depends(get_spider_service)):
    return service.get_ranking(site_id, video_type, cycle)


@router.get('/detail')
def get_detail(site_id: int, num: str, url: str, service=Depends(get_spider_service)):
    return service.get_detail(site_id, num, url)


@router.get('/search', response_model=R[list[SiteVideo]])
def search_video(num: str, service=Depends(get_spider_service)):
    return R.list(service.search_video(num))

@router.get('/log')
async def get_logs(request: Request):
    log_path = Path(f'{Path(__file__).cwd()}/config/app.log')

    async def log_generator():
        if log_path.exists():
            for line in read_last_lines(log_path, 50):
                yield format_sse(build_log_event(line))

        log_file = None
        last_stat: os.stat_result | None = None
        heartbeat_interval = 15
        last_heartbeat = asyncio.get_running_loop().time()

        try:
            while True:
                if await request.is_disconnected():
                    break

                if not log_path.exists():
                    now = asyncio.get_running_loop().time()
                    if now - last_heartbeat >= heartbeat_interval:
                        yield ": ping\n\n"
                        last_heartbeat = now
                    await asyncio.sleep(1)
                    continue

                current_stat = log_path.stat()
                should_reopen = (
                    log_file is None
                    or last_stat is None
                    or current_stat.st_ino != last_stat.st_ino
                )
                if should_reopen:
                    if log_file is not None:
                        log_file.close()
                    log_file = open(log_path, 'r', encoding='utf-8', errors='replace')
                    log_file.seek(0, os.SEEK_END)
                    last_stat = current_stat

                if log_file.tell() > current_stat.st_size:
                    log_file.seek(0)

                line = log_file.readline()
                if line:
                    yield format_sse(build_log_event(line))
                    last_heartbeat = asyncio.get_running_loop().time()
                    continue

                now = asyncio.get_running_loop().time()
                if now - last_heartbeat >= heartbeat_interval:
                    yield ": ping\n\n"
                    last_heartbeat = now
                await asyncio.sleep(0.5)
        finally:
            if log_file is not None:
                log_file.close()

    return StreamingResponse(
        log_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
