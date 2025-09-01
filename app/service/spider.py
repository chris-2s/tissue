import asyncio
import importlib
import traceback
from datetime import datetime
from urllib.parse import urlparse

from fastapi import Depends
from sqlalchemy.orm import Session
from starlette.concurrency import run_in_threadpool

from app.db import get_db
from app.db.models import Site
from app.schema import VideoDetail
from app.service.base import BaseService
from app.utils import cache
from app.utils.logger import logger
from app.utils.spider import JavBusSpider, JavDBSpider, Jav321Spider, DmmSpider
from app.utils.spider.spider import Spider
from app.utils.spider.spider_exception import SpiderException


def get_spider_service(db: Session = Depends(get_db)):
    return SpiderService(db=db)


class SpiderService(BaseService):
    @staticmethod
    def get_spider_by_name(class_str: str):
        try:
            module_path = 'app.utils.spider'
            module = importlib.import_module(module_path)
            return getattr(module, class_str)
        except (ImportError, AttributeError) as e:
            return None

    @staticmethod
    def get_video_cover(url: str):
        component = urlparse(url)

        cached = cache.get_cache_file('cover', url)
        if cached is not None:
            return cached

        match component.hostname:
            case 'c0.jdbstatic.com':
                response = JavDBSpider.get_cover(url)
            case _:
                response = Spider.get_cover(url)

        if response:
            cache.cache_file('cover', url, response)
        return response

    def _merge_video_info(self, metas: list[VideoDetail]) -> VideoDetail:
        meta = metas[0]
        if len(metas) >= 2:
            logger.info("合并多个刮削信息...")
            for key in meta.__dict__:
                if not getattr(meta, key) and key not in ['website', 'previews', 'comments', 'downloads']:
                    for other_meta in metas[1:]:
                        value = getattr(other_meta, key)
                        if value:
                            setattr(meta, key, value)
                            break
            meta.website = [m.website[0] for m in metas if m.website]
            meta.previews = [m.previews[0] for m in metas if m.previews]
            meta.comments = [m.comments[0] for m in metas if m.comments]
            meta.downloads = sum(map(lambda x: x.downloads, metas), [])
            if meta.downloads:
                meta.downloads.sort(key=lambda i: i.publish_date or datetime.now().date(), reverse=True)
            logger.info("信息合并成功")
        return meta

    def _get_spiders(self):
        sites = self.db.query(Site).filter(Site.status == 1).order_by(Site.priority).all()
        spiders = []
        for site in sites:
            spider_class = self.get_spider_by_name(site.class_str)
            spider = spider_class(alternate_host=site.alternate_host)
            spiders.append(spider)
        return spiders

    async def _get_video_by_spiders(self, number: str, include_downloads: bool, include_previews: bool,
                                    include_comments: bool):
        def __get_video_by_spider(spider: Spider):
            try:
                logger.info(f"{spider.name} 开始刮削...")
                videos = spider.get_info(number, include_downloads=include_downloads,
                                         include_previews=include_previews,
                                         include_comments=include_comments)
                logger.info(f"{spider.name} 刮削成功")
                if include_downloads:
                    logger.info(f"{spider.name} 获取到{len(videos.downloads)}部影片")
                return videos
            except SpiderException as e:
                logger.info(f"{spider.name} {e.message}")
            except Exception:
                logger.error(f'{spider.name} 未知错误，请检查网站连通性')
                traceback.print_exc()
                return None

        spiders = self._get_spiders()
        tasks = [run_in_threadpool(__get_video_by_spider, spider=spider) for spider in spiders]
        return list(filter(lambda item: item, await asyncio.gather(*tasks)))

    def get_video_info(self, number: str):
        logger.info(f"开始刮削番号《{number}》")

        metas = asyncio.run(
            self._get_video_by_spiders(number, include_downloads=False, include_previews=False, include_comments=False))

        if len(metas) == 0:
            return None

        meta = self._merge_video_info(metas)

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

    def get_ranking(self, source: str, video_type: str, cycle: str):
        if source == 'JavDB':
            site = self.db.query(Site).filter(Site.class_str == 'JavDBSpider').one()
            return JavDBSpider(alternate_host=site.alternate_host).get_ranking(video_type, cycle)
        return None

    def get_ranking_detail(self, source: str, num: str, url: str):
        if source == 'JavDB':
            site = self.db.query(Site).filter(Site.class_str == 'JavDBSpider').one()
            return JavDBSpider(alternate_host=site.alternate_host).get_info(num=num, url=url, include_downloads=True,
                                                                            include_previews=True,
                                                                            include_comments=True)
        return None
