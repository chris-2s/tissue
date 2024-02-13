import jwt
from fastapi import Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.db.models.user import User
from app.exception import AuthenticationException, AuthorizationException
from app.middleware.requestvars import g
from app.utils.security import oauth2_scheme, secret_key, algorithm


def verify_token(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, secret_key, algorithms=[algorithm])
        g().current_user_id = int(payload['sub'])
    except:
        raise AuthenticationException()


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
