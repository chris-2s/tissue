from fastapi import APIRouter, Depends

from app.schema.r import R
from app.service.download import get_download_service

router = APIRouter()


@router.get("/")
def get_downloads(service=Depends(get_download_service)):
    downloads = service.get_downloads()
    return R.list(downloads)


@router.get('/complete')
def complete_download(torrent_hash: str, service=Depends(get_download_service)):
    service.complete_download(torrent_hash)
    return R.ok()
