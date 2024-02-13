from fastapi import Depends
from sqlalchemy.orm import Session

from app.db import User, get_db
from app.exception import BizException
from app.service.base import BaseService


def get_auth_service(db: Session = Depends(get_db)):
    return AuthService(db)


class AuthService(BaseService):

    def get_access_token(self, form_data):
        token = User.verify(self.db, form_data.username, form_data.password)
        if not token:
            raise BizException(message="用户名或密码不正确")
        return token
