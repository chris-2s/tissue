from datetime import datetime

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger

from app.schema import Setting
from app.service.download import DownloadService


class Scheduler:
    jobs = {
        'scrape_download': {
            'key': 'scrape_download',
            'name': '整理下载',
            'job': DownloadService.job_scrape_download,
            'interval': 5
        },
        'delete_complete_download': {
            'key': 'delete_complete_download',
            'name': '删除已整理下载',
            'job': DownloadService.job_delete_complete_download,
            'interval': 5
        },
    }

    def __init__(self):
        self.scheduler = BackgroundScheduler()

    def init(self):
        setting = Setting()
        if setting.download.trans_auto:
            self.add('scrape_download')
        if setting.download.delete_auto:
            self.add('delete_complete_download')

        self.scheduler.start()

    def list(self):
        return self.scheduler.get_jobs()

    def add(self, key: str):
        job = self.jobs.get(key)
        self.scheduler.add_job(job['job'],
                               trigger=IntervalTrigger(minutes=job['interval']),
                               id=job['key'],
                               name=job['name'],
                               replace_existing=True)

    def remove(self, key: str):
        self.scheduler.remove_job(key)

    def manually(self, key: str):
        job = self.scheduler.get_job(key)
        job.modify(next_run_time=datetime.now())


scheduler = Scheduler()
