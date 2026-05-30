from fastapi import APIRouter, Depends

from app.schema.r import R
from app.service.spider import get_spider_service

router = APIRouter()


@router.get("/")
def get_actor(name: str, service=Depends(get_spider_service)):
    return R.ok(service.get_actor(name))
