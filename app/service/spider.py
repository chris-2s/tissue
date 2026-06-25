import asyncio
import traceback
from datetime import datetime
from typing import Type

from fastapi import Depends
from sqlalchemy.orm import Session
from starlette.concurrency import run_in_threadpool

from app.db import get_db
from app.db.models import Site
from app.schema import SiteCapabilities, SpiderKey, VideoDetail
from app.schema.site import MetadataPriorityFieldKey
from app.schema.actor import Actor, ActorPage, ImageInfo
from app.schema.home import SiteVideo
from app.service.base import BaseService
from app.service.metadata_priority import MetadataPriorityService
from app.utils.logger import logger
from app.utils.spider import DmmSpider, Jav321Spider, JavBusSpider, JavDBSpider
from app.utils.spider.spider import Spider
from app.utils.spider.spider_exception import SpiderException
from app.exception import BizException


def get_spider_service(db: Session = Depends(get_db)):
    return SpiderService(db=db)


class SpiderService(BaseService):
    SPIDER_REGISTRY: dict[SpiderKey, Type[Spider]] = {
        SpiderKey.JAVDB: JavDBSpider,
        SpiderKey.JAVBUS: JavBusSpider,
        SpiderKey.JAV321: Jav321Spider,
        SpiderKey.DMM: DmmSpider,
    }

    @staticmethod
    def normalize_spider_key(spider_key: str | SpiderKey) -> SpiderKey | None:
        if isinstance(spider_key, SpiderKey):
            return spider_key
        try:
            return SpiderKey(spider_key)
        except ValueError:
            return None

    @classmethod
    def get_spider_class(cls, spider_key: str | SpiderKey) -> Type[Spider] | None:
        normalized_key = cls.normalize_spider_key(spider_key)
        if not normalized_key:
            return None
        return cls.SPIDER_REGISTRY.get(normalized_key)

    @classmethod
    def get_spider_capabilities(cls, spider_key: str | SpiderKey) -> SiteCapabilities:
        spider_class = cls.get_spider_class(spider_key)
        if not spider_class:
            return SiteCapabilities(
                supports_ranking=False,
                supports_actor=False,
                supports_login=False,
                supports_downloads=False,
                supports_previews=False,
                supports_comments=False,
            )

        return SiteCapabilities(
            supports_ranking=spider_class.supports_ranking,
            supports_actor=spider_class.supports_actor,
            supports_login=spider_class.supports_login,
            supports_downloads=spider_class.supports_downloads,
            supports_previews=spider_class.supports_previews,
            supports_comments=spider_class.supports_comments,
        )

    @classmethod
    def build_spider(cls, site: Site, include_cookies: bool = True) -> Spider | None:
        spider_class = cls.get_spider_class(site.spider_key)
        if not spider_class:
            return None
        return spider_class(
            alternate_host=site.alternate_host,
            cookies=site.cookies if include_cookies else None,
            site_id=site.id,
        )

    def build_spider_by_site_id(self, site_id: int, include_cookies: bool = True) -> Spider | None:
        site = Site.get(self.db, site_id)
        if not site:
            return None
        return self.build_spider(site, include_cookies=include_cookies)

    def _merge_video_info(self, metas: list[VideoDetail]) -> VideoDetail:
        meta = metas[0].model_copy(deep=True)
        if len(metas) >= 2:
            logger.debug("合并多个刮削信息")
            field_orders = MetadataPriorityService(self.db).get_effective_field_orders()
            for field_name in ('cover', 'rating', 'actors'):
                setattr(meta, field_name, self._pick_prioritized_field(metas, field_name, field_orders[field_name]))

            skipped_fields = {'website', 'previews', 'comments', 'downloads', 'site_actors', 'cover', 'rating',
                              'actors'}
            for key in meta.__dict__:
                if key in skipped_fields:
                    continue
                if getattr(meta, key):
                    continue
                for other_meta in metas[1:]:
                    value = getattr(other_meta, key)
                    if value:
                        setattr(meta, key, value)
                        break
            meta.website = [m.website[0] for m in metas if m.website]
            meta.previews = [m.previews[0] for m in metas if m.previews]
            meta.comments = [m.comments[0] for m in metas if m.comments]
            meta.downloads = sum(map(lambda x: x.downloads, metas), [])
            meta.site_actors = [m.site_actors[0] for m in metas if m.site_actors]
            if meta.downloads:
                meta.downloads.sort(key=lambda i: i.publish_date or datetime.now().date(), reverse=True)
            logger.debug("信息合并成功")
        return meta

    @staticmethod
    def _pick_prioritized_field(metas: list[VideoDetail], field_name: str, spider_order: list[SpiderKey]):
        order_index = {spider_key.value: index for index, spider_key in enumerate(spider_order)}

        sorted_metas = sorted(
            enumerate(metas),
            key=lambda item: (
                order_index.get(item[1].source.spider_key, len(order_index)) if item[1].source else len(order_index),
                item[0],
            )
        )

        for _, meta in sorted_metas:
            value = getattr(meta, field_name)
            if value:
                return value
        return getattr(metas[0], field_name)

    def _get_spiders(self):
        sites = self.db.query(Site).filter(Site.status == 1).order_by(Site.priority).all()
        spiders = []
        for site in sites:
            spider = self.build_spider(site)
            if not spider:
                continue
            spiders.append(spider)
        return spiders

    def _get_actor_spiders(self):
        spiders = [spider for spider in self._get_spiders() if spider.supports_actor]
        actor_order = MetadataPriorityService(self.db).get_effective_site_order(MetadataPriorityFieldKey.ACTORS)
        order_index = {spider_key.value: index for index, spider_key in enumerate(actor_order)}
        return sorted(
            spiders,
            key=lambda spider: order_index.get(spider.key, len(order_index)),
        )

    @staticmethod
    def _close_spiders(spiders: list[Spider]):
        for spider in spiders:
            try:
                spider.close()
            except Exception:
                logger.debug(f"{spider.name} 会话关闭失败")

    async def _get_video_by_spiders(self, number: str, include_downloads: bool, include_previews: bool,
                                    include_comments: bool):
        def __get_video_by_spider(spider: Spider):
            try:
                logger.debug(f"{spider.name} 开始刮削")
                videos = spider.get_info(number, include_downloads=include_downloads,
                                         include_previews=include_previews,
                                         include_comments=include_comments)
                logger.debug(f"{spider.name} 刮削成功")
                if include_downloads:
                    logger.debug(f"{spider.name} 获取到{len(videos.downloads)}部影片")
                return videos
            except SpiderException as e:
                logger.warning(f"{spider.name} {e.message}")
            except Exception:
                logger.error(f'{spider.name} 未知错误，请检查网站连通性')
                traceback.print_exc()
                return None

        spiders = self._get_spiders()
        try:
            tasks = [run_in_threadpool(__get_video_by_spider, spider=spider) for spider in spiders]
            return list(filter(lambda item: item, await asyncio.gather(*tasks)))
        finally:
            self._close_spiders(spiders)

    async def _search_actor_by_spiders(self, name: str):
        def __search_actor_by_spider(spider: Spider):
            try:
                logger.debug(f"{spider.name} 开始刮削演员")
                actors = spider.search_actor(name)
                for actor in actors or []:
                    if not actor.thumb:
                        continue
                    thumb_info = spider.probe_image_info(actor.thumb)
                    if thumb_info:
                        actor.thumb_info = ImageInfo(**thumb_info)
                logger.debug(f"{spider.name} 演员刮削成功")
                return actors
            except SpiderException as e:
                logger.warning(f"{spider.name} {e.message}")
            except Exception:
                logger.error(f'{spider.name} 演员刮削未知错误，请检查网站连通性')
                traceback.print_exc()
                return None

        spiders = self._get_actor_spiders()
        try:
            tasks = [run_in_threadpool(__search_actor_by_spider, spider=spider) for spider in spiders]
            results = await asyncio.gather(*tasks)

            actors: list[Actor] = []
            for result in results:
                if not result:
                    continue
                actors.extend(result)
            return actors
        finally:
            self._close_spiders(spiders)

    async def _search_video_by_spiders(self, num: str):
        def __search_video_by_spider(spider: Spider):
            try:
                logger.debug(f"{spider.name} 开始搜索影片")
                videos = spider.search_video(num)
                logger.debug(f"{spider.name} 影片搜索成功")
                return videos
            except SpiderException as e:
                logger.warning(f"{spider.name} {e.message}")
            except Exception:
                logger.error(f'{spider.name} 影片搜索未知错误，请检查网站连通性')
                traceback.print_exc()
                return None

        spiders = self._get_spiders()
        try:
            tasks = [run_in_threadpool(__search_video_by_spider, spider=spider) for spider in spiders]
            results = await asyncio.gather(*tasks)

            videos: list[SiteVideo] = []
            for result in results:
                if not result:
                    continue
                videos.extend(result)
            return videos
        finally:
            self._close_spiders(spiders)

    def get_video_info(self, number: str):
        meta = self.get_video(number, include_downloads=False, include_previews=False, include_comments=False)
        logger.info(f"番号《{number}》刮削完成，标题：{meta.title}，演员：{'、'.join([i.name for i in meta.actors])}")
        return meta

    def get_video(self, number: str, include_downloads=True, include_previews=True, include_comments=True):
        logger.info(f"开始刮削番号《{number}》")

        metas = asyncio.run(
            self._get_video_by_spiders(number, include_downloads=include_downloads, include_previews=include_previews,
                                       include_comments=include_comments))

        if len(metas) == 0:
            return None

        meta = self._merge_video_info(metas)

        return meta

    def get_ranking(self, site_id: int, video_type: str, cycle: str):
        spider = self.build_spider_by_site_id(site_id)
        if not spider or not spider.supports_ranking:
            return None
        try:
            return spider.get_ranking(video_type, cycle)
        finally:
            spider.close()

    def get_detail(self, site_id: int, num: str, url: str):
        spider = self.build_spider_by_site_id(site_id)
        if not spider:
            return None
        try:
            return spider.get_info(num=num, url=url, include_downloads=True,
                                   include_previews=True, include_comments=True)
        finally:
            spider.close()

    def get_actor_page(self, site_id: int, code: str, page: int) -> ActorPage:
        spider = self.build_spider_by_site_id(site_id)
        if not spider or not spider.supports_actor:
            raise BizException("当前站点不支持演员页")
        try:
            return spider.get_actor_page(code, page)
        finally:
            spider.close()

    def search_actor(self, name: str):
        logger.info(f"开始刮削演员《{name}》")
        return asyncio.run(self._search_actor_by_spiders(name))

    def get_actor(self, name: str):
        return self.search_actor(name)

    def search_video(self, num: str):
        logger.info(f"开始搜索影片《{num}》")
        return asyncio.run(self._search_video_by_spiders(num))
