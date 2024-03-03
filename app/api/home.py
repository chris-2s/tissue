import os
import time
from pathlib import Path

import psutil
import tailer
from cachetools import cached, TTLCache
from fastapi import APIRouter

from app.schema import HomeMemory, Setting, HomeDisk, HomeDownload
from app.utils import nfo
from app.utils.qbittorent import qbittorent
from fastapi.responses import StreamingResponse

router = APIRouter()


@router.get("/cpu")
def get_cpu_percent():
    cpu_percent = psutil.cpu_percent(interval=1)
    return cpu_percent


@router.get("/memory")
def get_memory_info():
    memory = psutil.virtual_memory()
    return HomeMemory(total=memory.total, available=memory.available)


@router.get("/disk")
def get_disk_space():
    setting = Setting()

    result = []
    if os.path.exists(setting.app.video_path):
        video_usage = psutil.disk_usage(setting.app.video_path)
        result.append(HomeDisk(type='视频', total=video_usage.total, available=video_usage.free))
    else:
        result.append(HomeDisk(type='视频', total=0, available=0))

    if os.path.exists(setting.file.path):
        file_usage = psutil.disk_usage(setting.file.path)
        result.append(HomeDisk(type='文件', total=file_usage.total, available=file_usage.free))
    else:
        result.append(HomeDisk(type='文件', total=0, available=0))

    if setting.download.mapping_path and os.path.exists(setting.download.mapping_path):
        download_usage = psutil.disk_usage(setting.download.mapping_path)
        result.append(HomeDisk(type='下载', total=download_usage.total, available=download_usage.free))
    else:
        result.append(HomeDisk(type='下载', total=0, available=0))

    return result


@router.get('/video')
@cached(cache=TTLCache(maxsize=1, ttl=300))
def get_video_info():
    setting = Setting().app
    videos = []
    for root, _, files in os.walk(setting.video_path):
        for file in files:
            path = os.path.join(root, file)
            _, ext_name = os.path.splitext(path)
            size = os.stat(path).st_size

            if ext_name in setting.video_format.split(',') and size > (setting.video_size_minimum * 1024 * 1024):
                videos.append(nfo.get_basic(path, True))
    return videos


@router.get('/download')
def get_download_info():
    try:
        info = qbittorent.get_trans_info()
        return HomeDownload(upload_speed=info['up_info_speed'],
                            download_speed=info['dl_info_speed'])
    except:
        return HomeDownload(upload_speed=0,
                            download_speed=0)


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
