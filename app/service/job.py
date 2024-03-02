import hashlib
import os

from app.db import SessionFactory
from app.schema import Setting
from app.service.subscribe import SubscribeService
from app.utils import nfo
from app.utils.cache import cache_path


def clean_cache():
    urls = set()
    setting = Setting().app
    with SessionFactory() as db:
        subscribes = SubscribeService(db=db).get_subscribes()
        for subscribe in subscribes:
            urls.add(subscribe.cover)

    for root, _, files in os.walk(setting.video_path):
        for file in files:
            if file.endswith('.nfo'):
                info = nfo.get_full(str(os.path.join(root, file)))
                urls.add(info.cover)
                for actor in info.actors:
                    urls.add(actor.thumb)

    hashed_urls = set()
    for url in urls:
        md = hashlib.md5()
        md.update(url.encode("utf-8"))
        hashed_urls.add(md.hexdigest())

    cache_save_path = os.path.join(cache_path, 'cover')
    caches = os.listdir(cache_save_path)
    for cache in caches:
        if cache not in hashed_urls:
            os.remove(os.path.join(cache_save_path, cache))
