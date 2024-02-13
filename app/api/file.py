from fastapi import APIRouter, Depends

from app.schema.r import R
from app.service.file import get_file_service

router = APIRouter()


@router.get("/")
def get_files(service=Depends(get_file_service)):
    return R.list(service.get_files())
