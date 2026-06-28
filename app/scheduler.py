from datetime import datetime
from typing import Callable

from apscheduler.executors.pool import ThreadPoolExecutor
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from pydantic import BaseModel

from app.i18n import translate
from app.schema import Setting
from app.service.actor_favorite import ActorFavoriteService
from app.service.cookiecloud import CookieCloudService
from app.service.download import DownloadService
from app.service.resource import ResourceService
from app.service.site import SiteService
from app.service.subscribe import SubscribeService
from app.utils.logger import logger


class ScheduleOptions(BaseModel):
    interval: int
    jitter: int = 0
    interval_unit: str = 'minutes'


def build_fixed_schedule(interval: int, jitter: int = 0, interval_unit: str = 'minutes') -> Callable[[], ScheduleOptions]:
    def provider() -> ScheduleOptions:
        return ScheduleOptions(interval=interval, jitter=jitter, interval_unit=interval_unit)

    return provider


def build_subscribe_schedule() -> ScheduleOptions:
    interval = max(Setting().crawler.subscribe_interval_minutes, 15)
    jitter = max(round(interval * 60 * 0.1), 1)
    return ScheduleOptions(interval=interval, jitter=jitter)


class Job(BaseModel):
    key: str
    name: str
    job: Callable
    running: int = 0
    immediate: bool = False
    max_instances: int = 1
    misfire_grace_time: int = 300
    schedule_provider: Callable[[], ScheduleOptions]


class Scheduler:
    jobs = {
        'subscribe': Job(key='subscribe',
                         name='scheduler.job.subscribe',
                         job=SubscribeService.job_subscribe,
                         schedule_provider=build_subscribe_schedule),
        'actor_favorite_thumb_update': Job(key='actor_favorite_thumb_update',
                                           name='scheduler.job.actor_favorite_thumb_update',
                                           job=ActorFavoriteService.job_refresh_missing_thumb,
                                           schedule_provider=build_fixed_schedule(interval=100 * 60, jitter=6 * 60 * 60)),
        'scrape_download': Job(key='scrape_download',
                               name='scheduler.job.scrape_download',
                               job=DownloadService.job_scrape_download,
                               schedule_provider=build_fixed_schedule(interval=5)),
        'delete_complete_download': Job(key='delete_complete_download',
                                        name='scheduler.job.delete_complete_download',
                                        job=DownloadService.job_delete_complete_download,
                                        schedule_provider=build_fixed_schedule(interval=5)),
        'clean_image_cache': Job(key='clean_image_cache',
                                 name='scheduler.job.clean_image_cache',
                                 job=ResourceService.job_clean_cache,
                                 schedule_provider=build_fixed_schedule(interval=12 * 60, jitter=60)),
        'refresh_available_sites': Job(key='refresh_available_sites',
                                       name='scheduler.job.refresh_available_sites',
                                       job=SiteService.job_testing_sites,
                                       schedule_provider=build_fixed_schedule(interval=1 * 24 * 60, jitter=2 * 60 * 60),
                                       immediate=True),
        'cookiecloud_sync': Job(key='cookiecloud_sync',
                                name='scheduler.job.cookiecloud_sync',
                                job=CookieCloudService().sync,
                                schedule_provider=build_fixed_schedule(interval=60),
                                immediate=True),
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

    def add(
        self,
        key: str,
        run_now: bool = False,
        interval: int | None = None,
        jitter: int | None = None,
    ):
        job = self.jobs.get(key)
        job_name = translate(job.name)
        logger.info(translate('log.scheduler.job_started', {'job_name': job_name}))
        job_kwargs = {}
        if job.immediate or run_now:
            job_kwargs['next_run_time'] = datetime.now()

        schedule = job.schedule_provider()
        resolved_interval = interval if interval is not None else schedule.interval
        resolved_jitter = jitter if jitter is not None else schedule.jitter
        interval_unit = schedule.interval_unit

        self.scheduler.add_job(self.do_job,
                               trigger=IntervalTrigger(**{interval_unit: resolved_interval}, jitter=resolved_jitter),
                               id=job.key,
                               name=job_name,
                               args=[job.key],
                               max_instances=job.max_instances,
                               misfire_grace_time=job.misfire_grace_time,
                               replace_existing=True, **job_kwargs)

    def remove(self, key: str):
        job = self.scheduler.get_job(key)
        if job:
            logger.info(translate('log.scheduler.job_stopped', {'job_name': job.name}))
            self.scheduler.remove_job(key)

    def manually(self, key: str):
        job = self.scheduler.get_job(key)
        job.modify(next_run_time=datetime.now())

    @classmethod
    def do_job(cls, key):
        job = cls.jobs[key]
        try:
            logger.info(translate('log.scheduler.job_running', {'job_name': translate(job.name)}))
            job.running += 1
            job.job()
        finally:
            job.running -= 1


scheduler = Scheduler()
