from fastapi import APIRouter, Depends

from app.schema.r import R
from app.service.history import get_history_service

router = APIRouter()


@router.get('/')
def get_histories(service=Depends(get_history_service)):
    histories = service.get_histories()
    return histories


@router.delete('/')
def delete_history(history_id: int, service=Depends(get_history_service)):
    service.delete_history(history_id)
    return R.ok()
