from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from app.schema.r import R
from app.service.auth import get_auth_service

router = APIRouter()


@router.post("/login")
def get_access_token(service=Depends(get_auth_service), form_data: OAuth2PasswordRequestForm = Depends()):
    token = service.get_access_token(form_data)
    return R.ok(token)
