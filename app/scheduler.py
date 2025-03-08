import logging

from datetime import datetime
from typing import Callable

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from pydantic import BaseModel

from app.schema import Setting
from app.service.download import DownloadService
from app.service.job import clean_cache
from app.service.subscribe import SubscribeService
from app.utils.logger import logger


class Job(BaseModel):
    key: str
    name: str
    job: Callable
    interval: int
    running: int = 0
    jitter: int = 0


class Scheduler:
    jobs = {
        'subscribe': Job(key='subscribe',
                         name='订阅下载',
                         job=SubscribeService.job_subscribe,
                         interval=400, jitter=30 * 60),
        'subscribe_meta_update': Job(key='subscribe_meta_update',
                                     name='订阅元数据更新',
                                     job=SubscribeService.job_subscribe_meta_update,
                                     interval=100 * 60, jitter=6 * 60 * 60),
        'scrape_download': Job(key='scrape_download',
                               name='整理已完成下载',
                               job=DownloadService.job_scrape_download,
                               interval=5),
        'delete_complete_download': Job(key='delete_complete_download',
                                        name='删除已整理下载',
                                        job=DownloadService.job_delete_complete_download,
                                        interval=5),
        'clean_cache': Job(key='clean_cache',
                           name='清理缓存',
                           job=clean_cache,
                           interval=7 * 24 * 60),
    }

    def __init__(self):
        self.scheduler = BackgroundScheduler()

    def init(self):
        self.scheduler.start()

        self.add('subscribe')
        self.add('subscribe_meta_update')
        self.add('clean_cache')

        setting = Setting()
        if setting.download.trans_auto:
            self.add('scrape_download')
        if setting.download.delete_auto:
            self.add('delete_complete_download')

    def list(self):
        return self.scheduler.get_jobs()

    def add(self, key: str):
        job = self.jobs.get(key)
        logger.info(f"启动任务，{job.name}")
        self.scheduler.add_job(self.do_job,
                               trigger=IntervalTrigger(minutes=job.interval, jitter=job.jitter),
                               id=job.key,
                               name=job.name,
                               args=[job.key],
                               replace_existing=True)

    def remove(self, key: str):
        job = self.scheduler.get_job(key)
        if job:
            logger.info(f"停止任务，{job.name}")
            self.scheduler.remove_job(key)

    def manually(self, key: str):
        job = self.scheduler.get_job(key)
        job.modify(next_run_time=datetime.now())

    @classmethod
    def do_job(cls, key):
        job = cls.jobs[key]
        try:
            logger.info(f'执行任务，{job.name}')
            job.running += 1
            job.job()
        finally:
            job.running -= 1


scheduler = Scheduler()
