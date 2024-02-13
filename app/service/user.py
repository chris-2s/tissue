from fastapi import Depends
from sqlalchemy.orm import Session

from app import schema
from app.db import User, get_db
from app.db.transaction import transaction
from app.exception import BizException
from app.service.base import BaseService
from app.utils.security import get_password_hash


def get_user_service(db: Session = Depends(get_db)):
    return UserService(db)


class UserService(BaseService):

    def get_user(self, user_id: int):
        return User.get(self.db, rid=user_id)

    def get_user_list(self):
        return User.list(self.db)

    @transaction
    def create_user(self, params: schema.UserCreate):
        exist = User.get_by_username(self.db, params.username)
        if exist:
            raise BizException("该用户名已存在")
        user = User(**params.model_dump())
        user.password = get_password_hash(params.password)
        user.add(self.db)

    @transaction
    def update_user(self, params: schema.UserUpdate):
        exist = User.get_by_username(self.db, params.username)
        if exist and exist.id != params.id:
            raise BizException("该用户名已存在")
        user = User.get(self.db, params.id)
        if params.password:
            params.password = get_password_hash(params.password)
        else:
            params.password = user.password
        user.update(self.db, params.model_dump())

    @transaction
    def delete_user(self, user_id: int):
        user = User.get(self.db, user_id)
        user.delete(self.db)
