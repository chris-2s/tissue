import time
import traceback
from datetime import datetime
from random import randint

from fastapi import Depends
from sqlalchemy.orm import Session

from app import schema
from app.db import get_db, SessionFactory
from app.db.models import Subscribe, Torrent
from app.db.transaction import transaction
from app.exception import BizException
from app.service.base import BaseService
from app.utils import spider, notify
from app.utils.logger import logger
from app.utils.qbittorent import qbittorent
from app.utils.spider import JavdbSpider


def get_subscribe_service(db: Session = Depends(get_db)):
    return SubscribeService(db=db)


class SubscribeService(BaseService):

    def get_subscribes(self):
        return self.db.query(Subscribe).order_by(Subscribe.id.desc()).all()

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

    def search_video(self, num: str):
        video = spider.get_video(num)
        if not video:
            raise BizException("未找到影片")
        return video

    @transaction
    def download_video_manual(self, video: schema.SubscribeCreate, link: schema.VideoDownload):
        self.download_video(video, link)

    def do_subscribe(self):
        subscribes = self.get_subscribes()
        logger.info(f"获取到{len(subscribes)}个订阅")
        for subscribe in subscribes:
            time.sleep(randint(30, 60))

            result = spider.get_video(subscribe.num)
            if not result:
                logger.error("所有站点均未获取到影片")
                continue

            def get_matched(item):
                if subscribe.is_hd and not item.is_hd:
                    logger.error(f"{item.name} 不匹配高清，已跳过")
                    return False
                if subscribe.is_zh and not item.is_zh:
                    logger.error(f"{item.name} 不匹配中文，已跳过")
                    return False
                if subscribe.is_uncensored and not item.is_uncensored:
                    logger.error(f"{item.name} 不匹配无码，已跳过")
                    return False
                return True

            result = list(filter(get_matched, result.downloads))
            if not result:
                logger.error(f"未匹配到符合条件的影片")
                continue

            logger.info(f"匹配到符合条件的影片{len(result)}部，将选择最新发布的影片")
            matched = result[0]
            if matched:
                try:
                    self.download_video(schema.SubscribeCreate.model_validate(subscribe), matched)
                    logger.info(f"订阅《{subscribe.num}》已完成")
                    self.db.delete(subscribe)
                except Exception as e:
                    logger.error("下载任务创建失败")
                    traceback.print_exc()
                    continue

    def download_video(self, video: schema.SubscribeCreate, link: schema.VideoDownload):
        response = qbittorent.add_magnet(link.magnet)
        if response.status_code != 200:
            raise BizException('下载创建失败')
        logger.info(f"下载创建成功")
        if response.hash:
            torrent = Torrent()
            torrent.hash = response.hash
            torrent.num = video.num
            torrent.is_zh = link.is_zh
            torrent.is_uncensored = link.is_uncensored
            self.db.add(torrent)

        subscribe_notify = schema.SubscribeNotify.model_validate(video)
        subscribe_notify = subscribe_notify.model_copy(update=link.model_dump())
        notify.send_subscribe(subscribe_notify)

    def do_subscribe_meta_update(self):
        subscribes = self.get_subscribes()
        logger.info(f"获取到{len(subscribes)}个订阅")
        for subscribe in subscribes:
            info = spider.get_video_info(subscribe.num)
            if info:
                subscribe.cover = info.cover or subscribe.cover
                subscribe.title = info.title or subscribe.title
                subscribe.premiered = datetime.strptime(info.premiered,
                                                        '%Y-%m-%d').date() if info.premiered else subscribe.premiered
                subscribe.actors = ', '.join([i.name for i in info.actors]) if info.actors else subscribe.actors
                logger.info(f"已更新订阅《{subscribe.num}》元数据")
                self.db.add(subscribe)
            else:
                logger.error(f"未找到订阅《{subscribe.num}》元数据")

            time.sleep(randint(30, 60))

    @classmethod
    def job_subscribe(cls):
        with SessionFactory() as db:
            SubscribeService(db).do_subscribe()
            db.commit()

    @classmethod
    def job_subscribe_meta_update(cls):
        with SessionFactory() as db:
            SubscribeService(db).do_subscribe_meta_update()
            db.commit()
