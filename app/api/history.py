from fastapi import APIRouter, Depends

from app import schema
from app.schema.r import R
from app.service.history import get_history_service

router = APIRouter()


@router.get('/', response_model=R[list[schema.History]])
def get_histories(page: int = 1, limit: int = 20, keyword: str | None = None, service=Depends(get_history_service)):
    histories = service.get_histories(page=page, limit=limit, keyword=keyword)
    return R.pages(histories)


@router.delete('/')
def delete_history(history_id: int, service=Depends(get_history_service)):
    service.delete_history(history_id)
    return R.ok()
