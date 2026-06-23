from datetime import datetime
from typing import Callable

from apscheduler.executors.pool import ThreadPoolExecutor
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from pydantic import BaseModel

from app.schema import Setting
from app.service.actor_favorite import ActorFavoriteService
from app.service.cookiecloud import CookieCloudService
from app.service.download import DownloadService
from app.service.resource import ResourceService
from app.service.site import SiteService
from app.service.subscribe import SubscribeService
from app.utils.logger import logger


class Job(BaseModel):
    key: str
    name: str
    job: Callable
    interval: int
    running: int = 0
    jitter: int = 0
    immediate: bool = False
    max_instances: int = 1
    misfire_grace_time: int = 300


class Scheduler:
    jobs = {
        'subscribe': Job(key='subscribe',
                         name='订阅下载',
                         job=SubscribeService.job_subscribe,
                         interval=400, jitter=30 * 60),
        'actor_favorite_thumb_update': Job(key='actor_favorite_thumb_update',
                                           name='演员收藏头像刷新',
                                           job=ActorFavoriteService.job_refresh_missing_thumb,
                                           interval=100 * 60, jitter=6 * 60 * 60),
        'scrape_download': Job(key='scrape_download',
                               name='整理已完成下载',
                               job=DownloadService.job_scrape_download,
                               interval=5),
        'delete_complete_download': Job(key='delete_complete_download',
                                        name='删除已整理下载',
                                        job=DownloadService.job_delete_complete_download,
                                        interval=5),
        'clean_image_cache': Job(key='clean_image_cache',
                                 name='清理图片缓存',
                                 job=ResourceService.job_clean_cache,
                                 interval=12 * 60, jitter=60),
        'refresh_available_sites': Job(key='refresh_available_sites',
                                       name='刷新可用站点',
                                       job=SiteService.job_testing_sites,
                                       interval=1 * 24 * 60, jitter=2 * 60 * 60, immediate=True),
        'cookiecloud_sync': Job(key='cookiecloud_sync',
                                name='CookieCloud 同步',
                                job=CookieCloudService().sync,
                                interval=60, immediate=True),
    }

    def __init__(self):
        self.scheduler = BackgroundScheduler(
            executors={'default': ThreadPoolExecutor(max_workers=3)},
            job_defaults={
                'coalesce': True,
                'max_instances': 1,
                'misfire_grace_time': 300,
            }
        )

    def init(self):
        self.scheduler.start()

        self.add('subscribe')
        self.add('actor_favorite_thumb_update')
        self.add('clean_image_cache')
        self.add('refresh_available_sites')

        setting = Setting()
        if setting.download.trans_auto:
            self.add('scrape_download')
        if setting.download.delete_auto:
            self.add('delete_complete_download')
        if setting.cookiecloud.enabled:
            self.add('cookiecloud_sync')

    def list(self):
        return self.scheduler.get_jobs()

    def add(self, key: str):
        job = self.jobs.get(key)
        logger.info(f"启动任务，{job.name}")

        job_kwargs = {}
        if job.immediate:
            job_kwargs['next_run_time'] = datetime.now()

        self.scheduler.add_job(self.do_job,
                               trigger=IntervalTrigger(minutes=job.interval, jitter=job.jitter),
                               id=job.key,
                               name=job.name,
                               args=[job.key],
                               max_instances=job.max_instances,
                               misfire_grace_time=job.misfire_grace_time,
                               replace_existing=True, **job_kwargs)

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
