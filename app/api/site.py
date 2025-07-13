from typing import List

from fastapi import APIRouter, Depends

from app import schema
from app.scheduler import scheduler
from app.schema.r import R
from app.service.site import get_site_service

router = APIRouter()


@router.get('/', response_model=R[List[schema.Site]])
def get_sites(service=Depends(get_site_service)):
    sites = service.get_sites()
    return R.list(sites)


@router.put('/')
def modify_site(site: schema.SiteUpdate, service=Depends(get_site_service)):
    service.modify_site(site)
    return R.ok()


@router.post('/testing')
def testing_sites():
    scheduler.manually('refresh_available_sites')
    return R.ok()
