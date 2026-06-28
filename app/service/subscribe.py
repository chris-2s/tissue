import re
import time
import traceback
from random import randint

from fastapi import Depends
from sqlalchemy.orm import Session

from app import schema
from app.db import get_db, SessionFactory
from app.db.models import Subscribe, Torrent
from app.db.transaction import transaction
from app.exception import BizException
from app.integrations.downloaders.manager import downloader_manager
from app.integrations.notifications.manager import notification_manager
from app.schema import Setting
from app.schema.r import Page
from app.service.base import BaseService
from app.service.spider import SpiderService
from app.utils.logger import logger


def get_subscribe_service(db: Session = Depends(get_db)):
    return SubscribeService(db=db)


class SubscribeService(BaseService):

    def __init__(self, db: Session):
        super().__init__(db)
        self.setting = Setting()

    def get_subscribes(self):
        return self.db.query(Subscribe).filter(Subscribe.status != 2).order_by(Subscribe.id.desc()).all()

    def get_subscribe_histories(self, page: int = 1, limit: int = 12):
        query = self.db.query(Subscribe).filter(Subscribe.status == 2)
        total = query.count()
        subscribes = query.order_by(Subscribe.update_time.desc()).offset((page - 1) * limit).limit(limit).all()
        return Page(page=page, limit=limit, total=total, data=subscribes)

    @transaction
    def add_subscribe(self, param: schema.SubscribeCreate):
        exists = self.get_subscribes()

        if [exist for exist in exists if
            exist.num.upper() == param.num.upper() and exist.is_hd == param.is_hd and exist.is_zh == param.is_zh and exist.is_uncensored == param.is_uncensored]:
            raise BizException('存在相同订阅，无需重复添加')

        subscribe = Subscribe(**param.model_dump())
        subscribe.add(self.db)

    @transaction
    def update_subscribe(self, param: schema.SubscribeUpdate):
        exist = Subscribe.get(self.db, param.id)
        if not exist:
            raise BizException("该订阅不存在")

        exist.update(self.db, param.model_dump())

    @transaction
    def re_subscribe(self, subscribe_id: int):
        exist = Subscribe.get(self.db, subscribe_id)
        param = schema.SubscribeCreate(**exist.__dict__)
        param.status = 1
        self.add_subscribe(param)

    @transaction
    def delete_subscribe(self, subscribe_id: int):
        exist = Subscribe.get(self.db, subscribe_id)
        exist.delete(self.db)

    def search_video(self, num: str):
        video = SpiderService(self.db).get_video(num)
        if not video:
            raise BizException("未找到影片")
        return video

    @transaction
    def download_video_manual(self, video: schema.SubscribeCreate, link: schema.VideoDownload):
        self.download_video(video, link)

    def do_subscribe(self):
        subscribes = self.get_subscribes()
        logger.info(f"获取到{len(subscribes)}个订阅")
        pause_seconds = max(self.setting.crawler.subscribe_pause_seconds, 1)
        for index, subscribe in enumerate(subscribes):
            if index > 0:
                actual_pause_seconds = self._with_delay_jitter(
                    base_value=pause_seconds,
                    jitter_ratio=0.1,
                    minimum=1,
                )
                logger.debug(f"订阅任务暂停 {actual_pause_seconds} 秒后继续")
                time.sleep(actual_pause_seconds)

            result = SpiderService(self.db).get_video(subscribe.num, include_comments=False)
            if not result:
                logger.warning(f"订阅《{subscribe.num}》未从任何站点获取到影片")
                continue

            def get_matched(item):
                if subscribe.is_hd and not item.is_hd:
                    logger.debug(f"{item.name} 不匹配高清，已跳过")
                    return False
                if subscribe.is_zh and not item.is_zh:
                    logger.debug(f"{item.name} 不匹配中文，已跳过")
                    return False
                if subscribe.is_uncensored and not item.is_uncensored:
                    logger.debug(f"{item.name} 不匹配无码，已跳过")
                    return False

                if subscribe.include_keyword and not re.search(subscribe.include_keyword, item.name, re.IGNORECASE):
                    logger.debug(f"{item.name} 不匹配包含关键字，已跳过")
                    return False

                if subscribe.exclude_keyword and re.search(subscribe.exclude_keyword, item.name, re.IGNORECASE):
                    logger.debug(f"{item.name} 匹配排除关键字，已跳过")
                    return False

                return True

            result = list(filter(get_matched, result.downloads))
            if not result:
                logger.info(f"订阅《{subscribe.num}》未匹配到符合条件的影片")
                continue

            logger.info(f"匹配到符合条件的影片{len(result)}部，将选择最新发布的影片")
            matched = result[0]
            if matched:
                try:
                    self.download_video(schema.SubscribeCreate.model_validate(subscribe), matched)
                    logger.info(f"订阅《{subscribe.num}》已完成")
                    subscribe.update(self.db, {'status': 2})
                    self.db.commit()
                except Exception:
                    logger.error(f"订阅《{subscribe.num}》下载任务创建失败")
                    traceback.print_exc()
                    continue

    def download_video(self, video: schema.SubscribeCreate, link: schema.VideoDownload):
        category = self.setting.download.category if self.setting.download.category else None
        response = downloader_manager.get_active().add_magnet(link.magnet, Setting().download.download_path, category)
        if not response.success:
            raise BizException('下载创建失败')
        logger.info(f"下载创建成功")
        if response.torrent_hash:
            torrent = Torrent()
            torrent.hash = response.torrent_hash
            torrent.num = video.num
            torrent.is_zh = link.is_zh
            torrent.is_uncensored = link.is_uncensored
            self.db.add(torrent)

        subscribe_notify = schema.SubscribeNotify.model_validate({
            **video.model_dump(),
            **link.model_dump(),
        })
        notification_manager.send_subscribe(subscribe_notify)

    @classmethod
    def job_subscribe(cls):
        with SessionFactory() as db:
            SubscribeService(db).do_subscribe()
            db.commit()

    @staticmethod
    def _with_delay_jitter(base_value: int, jitter_ratio: float, minimum: int) -> int:
        normalized = max(base_value, minimum)
        jitter_max = max(round(normalized * jitter_ratio), 0)
        return normalized + randint(0, jitter_max)
