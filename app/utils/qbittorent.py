import random
import time
from dataclasses import dataclass
from typing import Optional

import qbittorrentapi
import requests

from app.exception import BizException
from app.schema import Setting
from app.utils.logger import logger


@dataclass
class AddMagnetResponse:
    status_code: int
    hash: str | None = None
    message: str | None = None


class QBittorent:
    def __init__(self):
        self.host: str | None = None
        self.tracker_subscribe: str | None = None
        self.client: qbittorrentapi.Client | None = None
        self._client_host: str | None = None
        self.refresh_settings()

    def refresh_settings(self):
        setting = Setting().download
        self.host = setting.host
        self.tracker_subscribe = setting.tracker_subscribe
        if self._client_host != self.host:
            self.client = None
            self._client_host = None

    def _build_client(self) -> qbittorrentapi.Client:
        self.refresh_settings()
        setting = Setting().download
        if not self.host:
            raise BizException('下载器地址未配置')
        return qbittorrentapi.Client(
            host=self.host,
            username=setting.username,
            password=setting.password,
        )

    def _ensure_client(self) -> qbittorrentapi.Client:
        if self.client is None or self._client_host != self.host:
            self.client = self._build_client()
            self._client_host = self.host
        return self.client

    def login(self):
        try:
            client = self._ensure_client()
            client.auth_log_in()
        except Exception as e:
            logger.error("下载器连接失败")
            raise BizException(f'下载器连接失败: {e}')

    def auth(func):
        def wrapper(self, *args, **kwargs):
            try:
                self.login()
                return func(self, *args, **kwargs)
            except Exception:
                logger.warning("登录信息失效，将尝试重新登录")
                self.login()
                return func(self, *args, **kwargs)

        return wrapper

    @auth
    def get_torrents(self, category: Optional[str] = None, include_failed=True, include_success=True):
        client = self._ensure_client()
        result = list(client.torrents_info(status_filter='completed', category=category))

        if not include_failed:
            result = filter(lambda item: '整理失败' not in item.get('tags', ''), result)

        if not include_success:
            result = filter(lambda item: '整理成功' not in item.get('tags', ''), result)

        return result

    @auth
    def get_torrent_files(self, torrent_hash: str):
        client = self._ensure_client()
        return list(client.torrents_files(torrent_hash=torrent_hash))

    @auth
    def add_torrent_tags(self, torrent_hash: str, tags: list[str]):
        client = self._ensure_client()
        client.torrents_add_tags(torrent_hashes=torrent_hash, tags=','.join(tags))

    @auth
    def remove_torrent_tags(self, torrent_hash: str, tags: list[str]):
        client = self._ensure_client()
        client.torrents_remove_tags(torrent_hashes=torrent_hash, tags=','.join(tags))

    @auth
    def delete_torrent(self, torrent_hash: str):
        client = self._ensure_client()
        client.torrents_delete(torrent_hashes=torrent_hash, delete_files=True)

    @auth
    def get_trans_info(self):
        client = self._ensure_client()
        return client.transfer_info()

    @auth
    def add_magnet(self, magnet: str, path: str, category: str | None = None):
        client = self._ensure_client()
        nonce = ''.join(random.sample('abcdefghijklmnopqrstuvwxyz', 5))
        try:
            client.torrents_add(urls=magnet, tags=nonce, save_path=path, category=category)
        except Exception as e:
            return AddMagnetResponse(status_code=500, message=str(e))

        torrent_hash = ''
        for _ in range(5):
            time.sleep(1)
            torrents = list(client.torrents_info(tag=nonce))
            if torrents:
                torrent_hash = torrents[0]['hash']
                break

        if self.tracker_subscribe and torrent_hash:
            trackers_text = requests.get(self.tracker_subscribe, timeout=10).text
            trackers = '\n'.join(filter(lambda item: item, trackers_text.split("\n")))
            if trackers:
                client.torrents_add_trackers(torrent_hash=torrent_hash, urls=trackers)

        self.remove_torrent_tags(torrent_hash, [nonce])
        return AddMagnetResponse(status_code=200, hash=torrent_hash or None)


qbittorent = QBittorent()
