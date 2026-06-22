from typing import List

from fastapi import APIRouter, Depends

from app import schema
from app.schema.r import R
from app.service.actor_favorite import get_actor_favorite_service
from app.service.spider import get_spider_service

router = APIRouter()


@router.get("/", response_model=R[List[schema.Actor]])
def get_actor(name: str, service=Depends(get_spider_service)):
    actors = service.get_actor(name)
    normalized_name = name.strip().casefold()
    result = []
    for actor in actors:
        if not actor.thumb:
            continue
        if (actor.name or '').strip().casefold() == normalized_name:
            result.append(actor)
        else:
            aliases = [(alias or '').strip().casefold() for alias in (actor.alias or [])]
            if normalized_name in aliases:
                result.append(actor)
    return R.ok(data=result)


@router.get("/search", response_model=R[List[schema.Actor]])
def search_actor(name: str, service=Depends(get_spider_service)):
    return R.ok(service.search_actor(name))


@router.get("/page", response_model=R[schema.ActorPage])
def get_actor_page(
    site_id: int,
    code: str,
    page: int = 1,
    service=Depends(get_spider_service),
    favorite_service=Depends(get_actor_favorite_service),
):
    result = service.get_actor_page(site_id, code, page)
    result.is_favorite = favorite_service.is_favorite(site_id, code)
    return R.ok(result)


@router.get("/favorite", response_model=R[List[schema.ActorFavorite]])
def get_actor_favorites(service=Depends(get_actor_favorite_service)):
    return R.list(service.list_favorites())


@router.post("/favorite", response_model=R[schema.ActorFavorite])
def add_actor_favorite(favorite: schema.ActorFavoriteCreate, service=Depends(get_actor_favorite_service)):
    return R.ok(service.add_favorite(favorite))


@router.delete("/favorite")
def delete_actor_favorite(favorite_id: int, service=Depends(get_actor_favorite_service)):
    service.delete_favorite(favorite_id)
    return R.ok()
