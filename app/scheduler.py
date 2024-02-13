from apscheduler.schedulers.background import BackgroundScheduler


class Scheduler:
    def __init__(self):
        self.scheduler = BackgroundScheduler()

    def init(self):
        self.scheduler.start()

    def list(self):
        return self.scheduler.get_jobs()


scheduler = Scheduler()
