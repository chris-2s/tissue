from fastapi import APIRouter, Depends

from app.schema.r import R
from app.service.spider import get_spider_service

router = APIRouter()


@router.get("/")
def get_actor(name: str, service=Depends(get_spider_service)):
    actors = service.get_actor(name)
    normalized_name = name.strip().casefold()
    for actor in actors:
        if (actor.name or '').strip().casefold() == normalized_name:
            return R.ok(actor)
        aliases = [(alias or '').strip().casefold() for alias in (actor.alias or [])]
        if normalized_name in aliases:
            return R.ok(actor)
    return R.ok()


@router.get("/search")
def search_actor(name: str, service=Depends(get_spider_service)):
    return R.ok(service.search_actor(name))
