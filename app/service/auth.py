from fastapi import Depends
from sqlalchemy.orm import Session

from app.db import User, get_db
from app.exception import BizException
from app.exception.codes import ErrorCode
from app.service.base import BaseService


def get_auth_service(db: Session = Depends(get_db)):
    return AuthService(db)


class AuthService(BaseService):

    def get_access_token(self, username: str, password: str, remember: bool = False):
        token = User.verify(self.db, username, password, remember=remember)
        if not token:
            raise BizException(message="用户名或密码错误", error_code=ErrorCode.AUTH_INVALID_CREDENTIALS)
        return token
