from fastapi import APIRouter

from app import schema
from app.scheduler import scheduler
from app.schema.r import R

router = APIRouter()


@router.get("/")
def get_schedules():
    schedules = scheduler.list()

    result = []
    for schedule in schedules:
        key = schedule.id
        name = schedule.name
        next_run_time = schedule.next_run_time
        result.append(schema.Schedule(key=key, name=name, next_run_time=next_run_time))

    return R.list(result)


@router.get('/fire')
def fire_schedule(key: str):
    scheduler.manually(key)
    return R.ok()
