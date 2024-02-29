from fastapi import APIRouter

from app import schema
from app.scheduler import scheduler
from app.schema.r import R

router = APIRouter()


@router.get("/")
def get_schedules():
    schedules = sorted(scheduler.list(), key=lambda i: i.id)

    result = []
    for schedule in schedules:
        job = scheduler.jobs[schedule.id]
        key = schedule.id
        name = schedule.name
        next_run_time = schedule.next_run_time
        status = job.running > 0
        result.append(schema.Schedule(key=key, name=name, next_run_time=next_run_time, status=status))

    return R.list(result)


@router.get('/fire')
def fire_schedule(key: str):
    scheduler.manually(key)
    return R.ok()
