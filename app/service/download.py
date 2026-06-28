import os

from fastapi import Depends
from requests import Session

from app import utils
from app.db import get_db, SessionFactory
from app.db.models import History, Torrent as DBTorrent
from app.exception import BizException
from app.exception.codes import ErrorCode
from app.i18n import translate
from app.integrations.downloaders.manager import downloader_manager
from app.integrations.notifications.manager import notification_manager
from app.schema.download import Torrent, TorrentFile
from app.schema.notification import VideoFailedPayload
from app.schema.setting import Setting
from app.schema.video import VideoDetail
from app.service.base import BaseService
from app.service.video import VideoService
from app.utils.logger import logger


def get_download_service(db: Session = Depends(get_db)):
    return DownloadService(db=db)


class DownloadService(BaseService):

    def __init__(self, db: Session):
        super().__init__(db)
        self.setting = Setting()
        self.downloader = downloader_manager.get_active()

    def get_downloads(self, include_success=False, include_failed=True):
        provider_payload = self.setting.download.get_provider_payload()
        if not provider_payload.get('host'):
            return []

        category = self.setting.download.category if self.setting.download.category else None
        infos = self.downloader.get_completed_torrents(
            category,
            include_success=include_success,
            include_failed=include_failed,
        )
        torrents = []
        for info in infos:
            torrent = Torrent(hash=info['hash'], name=info['name'], size=utils.convert_size(info['total_size']),
                              path=info['save_path'], tags=list(map(lambda i: i.strip(), info['tags'].split(','))))
            files = self.downloader.get_torrent_files(info['hash'])
            for file in filter(lambda item: item['progress'] == 1 and item['priority'] != 0, files):
                _, ext_name = os.path.splitext(file['name'])
                name = file['name'].split('/')[-1]
                size = file['size']
                path = info['content_path'] if len(files) == 1 else os.path.join(info['save_path'],
                                                                                 file['name'])

                if path.startswith(self.setting.download.download_path):
                    path = path.replace(self.setting.download.download_path, self.setting.download.mapping_path, 1)

                if ext_name in self.setting.library.video_format.split(',') and size > (
                        self.setting.library.video_size_minimum * 1024 * 1024):
                    torrent.files.append(TorrentFile(name=name, size=utils.convert_size(size), path=path))
            torrents.append(torrent)
        return torrents

    def complete_download(self, torrent_hash: str, is_success: bool = True):
        self.downloader.add_tags(torrent_hash, ['整理成功' if is_success else '整理失败'])

    def delete_download(self, torrent_hash: str):
        self.downloader.delete_torrent(torrent_hash)

    @classmethod
    def job_scrape_download(cls):
        setting = Setting()
        with SessionFactory() as db:
            download_service = DownloadService(db=db)
            video_service = VideoService(db=db)
            torrents = download_service.get_downloads(include_failed=False, include_success=False)
            logger.info(translate('log.download.completed_tasks_found', {'count': len(torrents)}))
            for torrent in torrents:
                download_service.scrape_download(video_service, torrent, setting.download.trans_mode)
            db.commit()

    def scrape_download(self, video_service: VideoService, torrent: Torrent, trans_mode: str):
        has_error = False
        for file in torrent.files:
            num = None
            video = VideoFailedPayload(path=file.path)
            try:
                matched_torrent = self.db.query(DBTorrent).filter_by(hash=torrent.hash).order_by(
                    DBTorrent.id.desc()).limit(1).one_or_none()

                if matched_torrent is not None:
                    match_num = VideoDetail(**matched_torrent.__dict__)
                else:
                    match_num = video_service.parse_video(file.path)

                num = match_num.num
                if num is None:
                    raise BizException(message='番号识别失败', error_code=ErrorCode.DOWNLOAD_NUMBER_PARSE_FAILED)
                video = video_service.scrape_video(num)
                video.path = file.path
                video.is_zh = match_num.is_zh
                video.is_uncensored = match_num.is_uncensored
                video_service.save_video(video, mode='download')

                if matched_torrent is not None:
                    self.db.query(DBTorrent).filter_by(hash=torrent.hash).delete()

            except BizException as e:
                has_error = True

                history = History(status=0, num=num, is_zh=video.is_zh,
                                  is_uncensored=video.is_uncensored,
                                  source_path=file.path, trans_method=trans_mode)
                history.add(video_service.db)

                video_notify = VideoFailedPayload.model_validate(video.model_dump())
                if os.path.exists(file.path):
                    video_notify.size = utils.convert_size(os.stat(file.path).st_size)
                    video_notify.message = e.message
                else:
                    video_notify.size = 'N/A'
                    video_notify.message = translate('message.file.not_found')
                logger.warning(translate('log.download.video_process_failed', {'message': video_notify.message}))
                notification_manager.emit_video_failed(video_notify)

        self.complete_download(torrent.hash, not has_error)

    @classmethod
    def job_delete_complete_download(cls):
        with SessionFactory() as db:
            download_service = DownloadService(db=db)
            torrents = download_service.get_downloads(include_success=True, include_failed=False)
            for torrent in torrents:
                if '整理成功' in torrent.tags:
                    download_service.delete_download(torrent.hash)
