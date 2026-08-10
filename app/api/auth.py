from fastapi import APIRouter, Depends, Form, Request, Response

from app.dependencies.security import get_current_user_id, verify_auth
from app.schema.r import R
from app.service.auth import get_auth_service
from app.utils.security import create_log_stream_token, log_stream_cookie_name

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


@router.post('/log-token', dependencies=[Depends(verify_auth)])
def get_log_stream_token(
    request: Request,
    response: Response,
    user_id: int = Depends(get_current_user_id),
):
    token = create_log_stream_token(user_id)
    forwarded_proto = request.headers.get('x-forwarded-proto', '')
    response.set_cookie(
        key=log_stream_cookie_name,
        value=token,
        httponly=True,
        secure=request.url.scheme == 'https' or forwarded_proto == 'https',
        samesite='lax',
        path='/',
    )
    return R.ok(token)
