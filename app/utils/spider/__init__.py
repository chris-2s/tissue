from urllib.parse import urlparse

from app.utils import cache
from app.utils.logger import logger
from app.utils.spider.dmm import DmmSpider
from app.utils.spider.jav321 import Jav321Spider
from app.utils.spider.javbus import JavbusSpider
from app.utils.spider.javdb import JavdbSpider
from app.utils.spider.spider import Spider
from app.utils.spider.spider_exception import SpiderException


def get_video_cover(url: str):
    component = urlparse(url)

    cached = cache.get_cache_file('cover', url)
    if cached is not None:
        return cached

    match component.hostname:
        case 'www.javbus.com':
            response = JavbusSpider.get_cover(url)
        case 'c0.jdbstatic.com':
            response = JavdbSpider.get_cover(url)
        case _:
            response = Spider.get_cover(url)

    if response:
        cache.cache_file('cover', url, response)
    return response


def get_video_info(number: str):
    spiders = [JavbusSpider(), JavdbSpider(), Jav321Spider(), DmmSpider()]
    metas = []
    for spider in spiders:
        try:
            logger.info(f"站点《{spider.name}》开始获取...")
            meta = spider.get_info(number)
            metas.append(meta)
            logger.info(f"站点《{spider.name}》获取成功!")
        except SpiderException as e:
            logger.info(f"站点《{spider.name}》获取失败：{e.message}，已跳过!!!")
        except Exception:
            logger.error(f'站点《{spider.name}》获取失败，已跳过!!!', exc_info=True)

    if len(metas) == 0:
        return

    meta = metas[0]
    if len(metas) >= 2:
        for key in meta.__dict__:
            if getattr(meta, key) is None:
                for other_meta in metas[1:]:
                    value = getattr(other_meta, key)
                    if value:
                        setattr(meta, key, value)
                        break
        meta.website = [m.website[0] for m in metas if m.website]
        logger.info("站点信息合并完成！")
    return meta


def get_video(number: str):
    spiders = [JavbusSpider(), JavdbSpider()]
    result = []
    for spider in spiders:
        try:
            meta = spider.get_info(number)
            if meta:
                videos = spider.get_video(meta.website[0])
                result += videos
        except:
            continue
    return result
