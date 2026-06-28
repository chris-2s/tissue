import re
import time
import traceback
from random import randint

from fastapi import Depends
from sqlalchemy.orm import Session

from app.db import get_db, SessionFactory
from app.db.models import Subscribe as SubscribeModel, Torrent
from app.db.transaction import transaction
from app.exception import BizException
from app.exception.codes import ErrorCode
from app.i18n import translate
from app.integrations.downloaders.manager import downloader_manager
from app.integrations.notifications.manager import notification_manager
from app.schema.notification import SubscribeStartedPayload
from app.schema.r import Page
from app.schema.setting import Setting
from app.schema.subscribe import SubscribeCreate, SubscribeUpdate
from app.schema.video import VideoDownload
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
        return self.db.query(SubscribeModel).filter(SubscribeModel.status != 2).order_by(SubscribeModel.id.desc()).all()

    def get_subscribe_histories(self, page: int = 1, limit: int = 12):
        query = self.db.query(SubscribeModel).filter(SubscribeModel.status == 2)
        total = query.count()
        subscribes = query.order_by(SubscribeModel.update_time.desc()).offset((page - 1) * limit).limit(limit).all()
        return Page(page=page, limit=limit, total=total, data=subscribes)

    @transaction
    def add_subscribe(self, param: SubscribeCreate):
        exists = self.get_subscribes()

        if [exist for exist in exists if
            exist.num.upper() == param.num.upper() and exist.is_hd == param.is_hd and exist.is_zh == param.is_zh and exist.is_uncensored == param.is_uncensored]:
            raise BizException('订阅已存在', error_code=ErrorCode.SUBSCRIBE_ALREADY_EXISTS)

        subscribe = SubscribeModel(**param.model_dump())
        subscribe.add(self.db)

    @transaction
    def update_subscribe(self, param: SubscribeUpdate):
        exist = SubscribeModel.get(self.db, param.id)
        if not exist:
            raise BizException("订阅不存在", error_code=ErrorCode.SUBSCRIBE_NOT_FOUND)

        exist.update(self.db, param.model_dump())

    @transaction
    def re_subscribe(self, subscribe_id: int):
        exist = SubscribeModel.get(self.db, subscribe_id)
        param = SubscribeCreate(**exist.__dict__)
        param.status = 1
        self.add_subscribe(param)

    @transaction
    def delete_subscribe(self, subscribe_id: int):
        exist = SubscribeModel.get(self.db, subscribe_id)
        exist.delete(self.db)

    def search_video(self, num: str):
        video = SpiderService(self.db).get_video(num)
        if not video:
            raise BizException("未找到影片", error_code=ErrorCode.SUBSCRIBE_VIDEO_NOT_FOUND)
        return video

    @transaction
    def download_video_manual(self, video: SubscribeCreate, link: VideoDownload):
        self.download_video(video, link)

    def do_subscribe(self):
        subscribes = self.get_subscribes()
        logger.info(translate('log.subscribe.found_total', {'count': len(subscribes)}))
        pause_seconds = max(self.setting.crawler.subscribe_pause_seconds, 1)
        for index, subscribe in enumerate(subscribes):
            if index > 0:
                actual_pause_seconds = self._with_delay_jitter(
                    base_value=pause_seconds,
                    jitter_ratio=0.1,
                    minimum=1,
                )
                logger.debug(translate('log.subscribe.paused_before_continue', {'seconds': actual_pause_seconds}))
                time.sleep(actual_pause_seconds)

            result = SpiderService(self.db).get_video(subscribe.num, include_comments=False)
            if not result:
                logger.warning(translate('log.subscribe.no_video_found_any_site', {'num': subscribe.num}))
                continue

            def get_matched(item):
                if subscribe.is_hd and not item.is_hd:
                    logger.debug(translate('log.subscribe.filter_hd_skip', {'name': item.name}))
                    return False
                if subscribe.is_zh and not item.is_zh:
                    logger.debug(translate('log.subscribe.filter_zh_skip', {'name': item.name}))
                    return False
                if subscribe.is_uncensored and not item.is_uncensored:
                    logger.debug(translate('log.subscribe.filter_uncensored_skip', {'name': item.name}))
                    return False

                if subscribe.include_keyword and not re.search(subscribe.include_keyword, item.name, re.IGNORECASE):
                    logger.debug(translate('log.subscribe.filter_include_keyword_skip', {'name': item.name}))
                    return False

                if subscribe.exclude_keyword and re.search(subscribe.exclude_keyword, item.name, re.IGNORECASE):
                    logger.debug(translate('log.subscribe.filter_exclude_keyword_skip', {'name': item.name}))
                    return False

                return True

            result = list(filter(get_matched, result.downloads))
            if not result:
                logger.info(translate('log.subscribe.no_match_found', {'num': subscribe.num}))
                continue

            logger.info(translate('log.subscribe.matched_candidates_select_latest', {'count': len(result)}))
            matched = result[0]
            if matched:
                try:
                    self.download_video(SubscribeCreate.model_validate(subscribe), matched)
                    logger.info(translate('log.subscribe.completed', {'num': subscribe.num}))
                    subscribe.update(self.db, {'status': 2})
                    self.db.commit()
                except Exception:
                    logger.error(translate('log.subscribe.create_download_failed', {'num': subscribe.num}))
                    traceback.print_exc()
                    continue

    def download_video(self, video: SubscribeCreate, link: VideoDownload):
        category = self.setting.download.category if self.setting.download.category else None
        response = downloader_manager.get_active().add_magnet(link.magnet, Setting().download.download_path, category)
        if not response.success:
            raise BizException('下载创建失败', error_code=ErrorCode.SUBSCRIBE_DOWNLOAD_CREATE_FAILED)
        logger.info(translate('log.subscribe.download_created'))
        if response.torrent_hash:
            torrent = Torrent()
            torrent.hash = response.torrent_hash
            torrent.num = video.num
            torrent.is_zh = link.is_zh
            torrent.is_uncensored = link.is_uncensored
            self.db.add(torrent)

        subscribe_payload = SubscribeStartedPayload.model_validate({
            'num': video.num,
            'cover': video.cover,
            'actors': video.actors,
            'is_hd': link.is_hd,
            'is_zh': link.is_zh,
            'is_uncensored': link.is_uncensored,
            'name': link.name,
            'url': link.url,
            'size': link.size,
            'publish_date': link.publish_date,
            'source': link.source,
        })
        notification_manager.emit_subscribe_started(subscribe_payload)

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
