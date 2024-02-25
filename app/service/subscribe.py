from fastapi import Depends
from sqlalchemy.orm import Session

from app import schema
from app.db import get_db
from app.db.models import Subscribe
from app.db.transaction import transaction
from app.exception import BizException
from app.service.base import BaseService


def get_subscribe_service(db: Session = Depends(get_db)):
    return SubscribeService(db=db)


class SubscribeService(BaseService):

    def get_subscribes(self):
        return self.db.query(Subscribe).all()

    @transaction
    def add_subscribe(self, param: schema.SubscribeCreate):
        subscribe = Subscribe(**param.model_dump())
        subscribe.add(self.db)

    @transaction
    def update_subscribe(self, param: schema.SubscribeUpdate):
        exist = Subscribe.get(self.db, param.id)
        if not exist:
            raise BizException("该订阅不存在")

        exist.update(self.db, param.model_dump())

    @transaction
    def delete_subscribe(self, subscribe_id: int):
        exist = Subscribe.get(self.db, subscribe_id)
        exist.delete(self.db)
