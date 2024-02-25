from fastapi import Depends
from sqlalchemy.orm import Session

from app import schema
from app.db import get_db, SessionFactory
from app.db.models import Subscribe
from app.db.transaction import transaction
from app.exception import BizException
from app.service.base import BaseService
from app.utils import spider, notify
from app.utils.qbittorent import qbittorent


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

    def do_subscribe(self):
        subscribes = self.get_subscribes()
        for subscribe in subscribes:
            result = spider.get_video(subscribe.num)
            if not result:
                continue

            def get_matched(item):
                if subscribe.is_hd and not item.is_hd:
                    return False
                if subscribe.is_zh and not item.is_zh:
                    return False
                if subscribe.is_uncensored and not item.is_uncensored:
                    return False
                return True

            result = list(filter(get_matched, result))
            result.sort(key=lambda i: i.publish_date, reverse=True)
            matched = result[0]
            if matched:
                response = qbittorent.add_magnet(matched.magnet)
                if response.status_code != 200:
                    continue
                subscribe_notify = schema.SubscribeNotify.model_validate(subscribe)
                subscribe_notify = subscribe_notify.model_copy(update=matched.model_dump())
                notify.send_subscribe(subscribe_notify)

                self.db.delete(subscribe)

    @classmethod
    def job_subscribe(cls):
        with SessionFactory() as db:
            SubscribeService(db).do_subscribe()
            db.commit()
