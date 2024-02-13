import json
from typing import Optional, List
from urllib.parse import urljoin

import requests

from app.exception import BizException


class QBittorent:
    def __init__(self, host: str, username: str, password: str):
        self.host = host
        self.session = requests.Session()
        try:
            response = self.session.post(url=urljoin(self.host, '/api/v2/auth/login'),
                                         data={'username': username, 'password': password})
            if response.status_code != 200:
                raise BizException(response.text)
        except:
            raise BizException('下载器连接失败')

    def get_torrents(self, category: Optional[str] = None):
        result = self.session.get(urljoin(self.host, '/api/v2/torrents/info'), params={
            'filter': ['seeding', 'completed'],
            'category': category
        }).json()

        return filter(lambda item: '整理成功' not in item['tags'], result)

    def get_torrent_files(self, torrent_hash: str):
        return self.session.get(urljoin(self.host, '/api/v2/torrents/files'), params={
            'hash': torrent_hash,
        }).json()

    def add_torrent_tags(self, torrent_hash: str, tags: List[str]):
        self.session.post(urljoin(self.host, '/api/v2/torrents/addTags'), data={
            'hashes': torrent_hash,
            'tags': ','.join(tags)
        })

    def remove_torrent_tags(self, torrent_hash: str, tags: List[str]):
        self.session.post(urljoin(self.host, '/api/v2/torrents/removeTags'), data={
            'hashes': torrent_hash,
            'tags': ','.join(tags)
        })
