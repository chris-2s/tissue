import os

from fastapi import Depends
from requests import Session

from app import schema, utils
from app.db import get_db
from app.schema import Torrent, TorrentFile, Setting
from app.service.base import BaseService
from app.utils.qbittorent import QBittorent


def get_download_service(db: Session = Depends(get_db)):
    return DownloadService(db=db)


class DownloadService(BaseService):

    def get_downloads(self):
        setting = Setting()
        if not setting.download.host:
            return []

        qb = QBittorent(setting.download.host, setting.download.username, setting.download.password)
        category = setting.download.category if setting.download.category else None
        infos = qb.get_torrents(category)
        torrents = []
        for info in infos:
            torrent = Torrent(hash=info['hash'], name=info['name'], size=utils.convert_size(info['total_size']),
                              path=info['save_path'])
            files = qb.get_torrent_files(info['hash'])
            for file in filter(lambda item: item['progress'] == 1, files):
                _, ext_name = os.path.splitext(file['name'])
                name = file['name'].split('/')[-1]
                size = file['size']
                path = info['content_path'] if len(files) == 1 else os.path.join(info['save_path'],
                                                                                 file['name'])

                if path.startswith(setting.download.download_path):
                    path = path.replace(setting.download.download_path, setting.download.mapping_path, 1)

                if ext_name in setting.app.video_format.split(',') and size > (
                        setting.app.video_size_minimum * 1024 * 1024):
                    torrent.files.append(TorrentFile(name=name, size=utils.convert_size(size), path=path))
            torrents.append(torrent)
        return torrents

    def complete_download(self, torrent_hash: str):
        setting = Setting()
        qb = QBittorent(setting.download.host, setting.download.username, setting.download.password)
        qb.add_torrent_tags(torrent_hash, ['整理成功'])
