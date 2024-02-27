import os
import time
from pathlib import Path

import psutil
import tailer
from fastapi import APIRouter

from app import utils
from app.schema import HomeSystem, Setting, HomeDisk, HomeDownload
from app.utils.qbittorent import qbittorent
from fastapi.responses import StreamingResponse

router = APIRouter()


@router.get("/system")
def get_system_info():
    cpu_percent = psutil.cpu_percent(interval=1)
    memory = psutil.virtual_memory()

    return HomeSystem(cpu_percent=cpu_percent, memory_total=utils.convert_size(memory.total),
                      memory_available=utils.convert_size(memory.available))


@router.get("/disk")
def get_disk_space():
    setting = Setting()

    if not os.path.exists(setting.app.video_path):
        os.makedirs(setting.app.video_path)
    video_usage = psutil.disk_usage(setting.app.video_path)
    video = utils.convert_size(video_usage.free, bits=0)

    if not os.path.exists(setting.file.path):
        os.makedirs(setting.file.path)
    file_usage = psutil.disk_usage(setting.file.path)
    file = utils.convert_size(file_usage.free, bits=0)

    disk = HomeDisk(video=video, file=file)

    if setting.download.mapping_path and setting.download.host:
        if not os.path.exists(setting.download.mapping_path):
            os.makedirs(setting.download.mapping_path)
        download_usage = psutil.disk_usage(setting.download.mapping_path)
        disk.download = utils.convert_size(download_usage.free, bits=0)

    return disk


@router.get('/video')
def get_video_count():
    setting = Setting().app
    count = 0
    for root, _, files in os.walk(setting.video_path):
        for file in files:
            path = os.path.join(root, file)
            _, ext_name = os.path.splitext(path)
            size = os.stat(path).st_size

            if ext_name in setting.video_format.split(',') and size > (
                    setting.video_size_minimum * 1024 * 1024):
                count += 1
    return count


@router.get('/download')
def get_download_info():
    try:
        info = qbittorent.get_trans_info()
        return HomeDownload(upload_speed=utils.convert_size(info['up_info_speed']),
                            download_speed=utils.convert_size(info['dl_info_speed']))
    except:
        return None


@router.get('/log')
def get_logs():
    def log_generator():
        log_path = Path(f'{Path(__file__).cwd()}/config/app.log')
        with open(log_path, 'r', encoding='utf-8') as f:
            for line in f.readlines()[-50:]:
                yield line
        while True:
            for t in tailer.follow(open(log_path, 'r', encoding='utf-8')):
                yield t or ''
            time.sleep(1)

    return StreamingResponse(log_generator(), media_type="text/event-stream")
