import random
import time
from typing import Any

import qbittorrentapi
import requests

from app.exception import BizException
from app.exception.codes import ErrorCode
from app.i18n import translate
from app.integrations.downloaders.base import AddTorrentResult, DownloaderProvider
from app.schema.setting import DownloaderQbittorrentConfig
from app.utils.logger import logger


class QBittorrentDownloader(DownloaderProvider):
    key = 'qbittorrent'
    label = 'qBittorrent'

    def __init__(self, config: dict[str, Any]):
        super().__init__(config)
        self.settings = DownloaderQbittorrentConfig(**config)
        self.client: qbittorrentapi.Client | None = None

    def _ensure_client(self) -> qbittorrentapi.Client:
        if self.client is None:
            if not self.settings.host:
                raise BizException('下载器地址未配置', error_code=ErrorCode.DOWNLOADER_NOT_CONFIGURED)
            self.client = qbittorrentapi.Client(
                host=self.settings.host,
                username=self.settings.username,
                password=self.settings.password,
            )
        return self.client

    def test_connection(self) -> None:
        try:
            self._ensure_client().auth_log_in()
        except Exception:
            logger.error(translate('log.downloader.connection_failed'))
            raise BizException(
                '下载器连接失败',
                error_code=ErrorCode.DOWNLOADER_CONNECTION_FAILED,
                error_params={'downloader': self.label},
            )

    def _call_with_login(self, callback):
        try:
            self.test_connection()
            return callback(self._ensure_client())
        except Exception:
            logger.warning(translate('log.downloader.relogin_retry'))
            self.client = None
            self.test_connection()
            return callback(self._ensure_client())

    def get_completed_torrents(self, category: str | None = None, include_failed: bool = True,
                               include_success: bool = True) -> list[dict[str, Any]]:
        def run(client: qbittorrentapi.Client):
            result = list(client.torrents_info(status_filter='completed', category=category))
            if not include_failed:
                result = filter(lambda item: '整理失败' not in item.get('tags', ''), result)
            if not include_success:
                result = filter(lambda item: '整理成功' not in item.get('tags', ''), result)
            return list(result)

        return self._call_with_login(run)

    def get_torrent_files(self, torrent_hash: str) -> list[dict[str, Any]]:
        return self._call_with_login(lambda client: list(client.torrents_files(torrent_hash=torrent_hash)))

    def add_tags(self, torrent_hash: str, tags: list[str]) -> None:
        self._call_with_login(lambda client: client.torrents_add_tags(torrent_hashes=torrent_hash,
                                                                      tags=','.join(tags)))

    def remove_tags(self, torrent_hash: str, tags: list[str]) -> None:
        self._call_with_login(lambda client: client.torrents_remove_tags(torrent_hashes=torrent_hash,
                                                                         tags=','.join(tags)))

    def delete_torrent(self, torrent_hash: str) -> None:
        self._call_with_login(lambda client: client.torrents_delete(torrent_hashes=torrent_hash, delete_files=True))

    def get_transfer_info(self) -> Any:
        return self._call_with_login(lambda client: client.transfer_info())

    def add_magnet(self, magnet: str, save_path: str, category: str | None = None) -> AddTorrentResult:
        client = self._ensure_client()
        nonce = ''.join(random.sample('abcdefghijklmnopqrstuvwxyz', 5))

        def run(current_client: qbittorrentapi.Client):
            current_client.torrents_add(urls=magnet, tags=nonce, save_path=save_path, category=category)

        try:
            self._call_with_login(run)
        except Exception as exc:
            return AddTorrentResult(success=False, message=str(exc))

        torrent_hash = ''
        for _ in range(5):
            time.sleep(1)
            torrents = self._call_with_login(lambda current_client: list(current_client.torrents_info(tag=nonce)))
            if torrents:
                torrent_hash = torrents[0]['hash']
                break

        if self.settings.tracker_subscribe and torrent_hash:
            trackers_text = requests.get(self.settings.tracker_subscribe, timeout=10).text
            trackers = '\n'.join(filter(lambda item: item, trackers_text.split("\n")))
            if trackers:
                self._call_with_login(lambda current_client: current_client.torrents_add_trackers(
                    torrent_hash=torrent_hash,
                    urls=trackers,
                ))

        if torrent_hash:
            self.remove_tags(torrent_hash, [nonce])
        return AddTorrentResult(success=True, torrent_hash=torrent_hash or None)
