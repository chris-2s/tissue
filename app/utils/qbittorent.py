import json
from typing import Optional, List
from urllib.parse import urljoin

import requests

from app.exception import BizException
from app.schema import Setting


class QBittorent:
    def __init__(self):
        setting = Setting().download
        self.host = setting.host
        self.session = requests.Session()

    def login(self):
        try:
            setting = Setting().download
            response = self.session.post(url=urljoin(self.host, '/api/v2/auth/login'),
                                         data={'username': setting.username, 'password': setting.password})
            if response.status_code != 200:
                raise BizException(response.text)
        except:
            raise BizException('下载器连接失败')

    def auth(func):
        def wrapper(self, *args, **kwargs):
            try:
                response = func(self, *args, **kwargs)
            except:
                self.login()
                response = func(self, *args, **kwargs)
            return response

        return wrapper

    @auth
    def get_torrents(self, category: Optional[str] = None, include_failed=True, include_success=True):
        result = self.session.get(urljoin(self.host, '/api/v2/torrents/info'), params={
            'filter': ['seeding', 'completed'],
            'category': category
        }).json()

        if not include_failed:
            result = filter(lambda item: '整理失败' not in item['tags'], result)

        if not include_success:
            result = filter(lambda item: '整理成功' not in item['tags'], result)

        return result

    @auth
    def get_torrent_files(self, torrent_hash: str):
        return self.session.get(urljoin(self.host, '/api/v2/torrents/files'), params={
            'hash': torrent_hash,
        }).json()

    @auth
    def add_torrent_tags(self, torrent_hash: str, tags: List[str]):
        self.session.post(urljoin(self.host, '/api/v2/torrents/addTags'), data={
            'hashes': torrent_hash,
            'tags': ','.join(tags)
        })

    @auth
    def remove_torrent_tags(self, torrent_hash: str, tags: List[str]):
        self.session.post(urljoin(self.host, '/api/v2/torrents/removeTags'), data={
            'hashes': torrent_hash,
            'tags': ','.join(tags)
        })

    @auth
    def delete_torrent(self, torrent_hash: str):
        self.session.post(urljoin(self.host, '/api/v2/torrents/delete'), data={
            'hashes': torrent_hash,
            'deleteFiles': 'true'
        })


qbittorent = QBittorent()
