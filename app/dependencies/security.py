import jwt
from fastapi import Cookie, Depends, Header, Query
from sqlalchemy.orm import Session

from app.db import get_db
from app.db.models.api_key import ApiKey
from app.db.models.user import User
from app.exception import AuthenticationException, AuthorizationException
from app.middleware.requestvars import g
from app.utils.logger import logger
from app.utils.security import (
    algorithm,
    decode_log_stream_token,
    log_stream_cookie_name,
    oauth2_optional_scheme,
    secret_key,
)


def _mask_api_key(api_key: str) -> str:
    if len(api_key) <= 8:
        return "****"
    return f"{api_key[:4]}...{api_key[-4:]}"


def _verify_jwt_token(db: Session, token: str) -> bool:
    try:
        payload = jwt.decode(token, secret_key, algorithms=[algorithm])
        user_id = int(payload['sub'])
        user = User.get(db, user_id)
        if not user:
            return False
        g().current_user_id = user_id
        return True
    except (jwt.InvalidTokenError, ValueError, TypeError, KeyError):
        return False


def _verify_api_key(db: Session, x_api_key: str) -> bool:
    key_record = ApiKey.get_by_key(db, x_api_key)
    if not key_record or not key_record.enabled:
        logger.warning(f"Rejected X-API-Key: {_mask_api_key(x_api_key)}")
        return False
    g().current_user_id = key_record.user_id
    return True


def verify_auth(
    db: Session = Depends(get_db),
    token: str | None = Depends(oauth2_optional_scheme),
    x_api_key: str | None = Header(default=None, alias="X-API-Key"),
):
    if token and _verify_jwt_token(db, token):
        return
    if x_api_key and _verify_api_key(db, x_api_key):
        return
    raise AuthenticationException()


def verify_log_stream_auth(
    db: Session = Depends(get_db),
    cookie_token: str | None = Cookie(default=None, alias=log_stream_cookie_name),
    query_token: str | None = Query(default=None, alias='sse_token'),
):
    token = cookie_token or query_token
    if not token:
        raise AuthenticationException()

    try:
        user_id = decode_log_stream_token(token)
    except (jwt.InvalidTokenError, ValueError, TypeError, KeyError):
        raise AuthenticationException() from None

    if not User.get(db, user_id):
        raise AuthenticationException()
    g().current_user_id = user_id


def get_current_user_id():
    return g().current_user_id


def get_current_user(db: Session = Depends(get_db)):
    return User.get(db, g().current_user_id)


def get_current_admin_user(db: Session = Depends(get_db)) -> User | None:
    user = User.get(db, g().current_user_id)
    if user.is_admin:
        return user
    else:
        raise AuthorizationException()
