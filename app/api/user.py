from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import schema
from app.db import get_db
from app.db.models.user import User
from app.dependencies.security import get_current_user_id, get_current_admin_user, get_current_user
from app.exception import AuthorizationException, BizException
from app.schema.r import R
from app.service.api_key import get_api_key_service
from app.service.user import UserService, get_user_service

router = APIRouter()


@router.get('/', response_model=R[schema.User])
def get_user(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    user = UserService(db).get_user(user_id)
    return R.ok(user)


@router.get('/list', response_model=R[List[schema.User]])
def get_user_list(service=Depends(get_user_service), admin: User = Depends(get_current_admin_user)):
    if admin:
        return R.list(service.get_user_list())
    else:
        raise AuthorizationException()


@router.post('/')
def create_user(params: schema.UserCreate, service=Depends(get_user_service), _=Depends(get_current_admin_user)):
    service.create_user(params)
    return R.ok()


@router.put('/')
def update_user(params: schema.UserUpdate, service=Depends(get_user_service), user: User = Depends(get_current_user)):
    if params.id != user.id and not user.is_admin:
        raise AuthorizationException()
    service.update_user(params)
    return R.ok()


@router.delete('/')
def delete_user(user_id: int, service=Depends(get_user_service), _: User = Depends(get_current_admin_user)):
    service.delete_user(user_id)
    return R.ok()


@router.get('/api-keys', response_model=R[List[schema.ApiKeyOut]])
def list_api_keys(
    user_id: int = Depends(get_current_user_id),
    service=Depends(get_api_key_service),
):
    return R.list(service.list_api_keys(user_id))


@router.post('/api-keys', response_model=R[schema.ApiKeyCreateOut])
def create_api_key(
    params: schema.ApiKeyCreate,
    user_id: int = Depends(get_current_user_id),
    service=Depends(get_api_key_service),
):
    return R.ok(service.create_api_key(user_id, params))


@router.patch('/api-keys/{api_key_id}')
def update_api_key(
    api_key_id: int,
    params: schema.ApiKeyUpdate,
    user_id: int = Depends(get_current_user_id),
    service=Depends(get_api_key_service),
):
    service.update_api_key(user_id, api_key_id, params)
    return R.ok()


@router.delete('/api-keys/{api_key_id}')
def delete_api_key(
    api_key_id: int,
    user_id: int = Depends(get_current_user_id),
    service=Depends(get_api_key_service),
):
    service.delete_api_key(user_id, api_key_id)
    return R.ok()
