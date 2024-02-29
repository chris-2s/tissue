import logging

from datetime import datetime
from typing import Callable

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from pydantic import BaseModel

from app.schema import Setting
from app.service.download import DownloadService
from app.service.subscribe import SubscribeService
from app.utils.logger import logger


class Job(BaseModel):
    key: str
    name: str
    job: Callable
    interval: int
    running: int = 0


class Scheduler:
    jobs = {
        'subscribe': Job(key='subscribe',
                         name='订阅下载',
                         job=SubscribeService.job_subscribe,
                         interval=60),
        'scrape_download': Job(key='scrape_download',
                               name='整理已完成下载',
                               job=DownloadService.job_scrape_download,
                               interval=5),
        'delete_complete_download': Job(key='delete_complete_download',
                                        name='删除已整理下载',
                                        job=DownloadService.job_delete_complete_download,
                                        interval=5),
    }

    def __init__(self):
        self.scheduler = BackgroundScheduler()

    def init(self):
        self.scheduler.start()

        self.add('subscribe')

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
                               trigger=IntervalTrigger(minutes=job.interval),
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
        logger.info(f"手动执行任务，{job.name}")
        job.modify(next_run_time=datetime.now())

    @classmethod
    def do_job(cls, key):
        job = cls.jobs[key]
        try:
            job.running += 1
            job.job()
        finally:
            job.running -= 1


scheduler = Scheduler()
