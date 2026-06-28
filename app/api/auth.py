from fastapi import APIRouter, Depends, Form
from app.schema.r import R
from app.service.auth import get_auth_service

router = APIRouter()


@router.post("/login")
def get_access_token(
    service=Depends(get_auth_service),
    username: str = Form(...),
    password: str = Form(...),
    remember: bool = Form(False),
):
    token = service.get_access_token(username, password, remember)
    return R.ok(token)
