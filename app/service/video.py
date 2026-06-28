import errno
import os
import shutil
from typing import List, Optional

from cachetools import cached, LRUCache
from fastapi import Depends
from sqlalchemy.orm import Session

from app import utils
from app.db import get_db
from app.db.models import History
from app.exception import BizException
from app.exception.codes import ErrorCode
from app.i18n import translate
from app.integrations.notifications.manager import notification_manager
from app.schema.notification import VideoSavedPayload
from app.schema.setting import Setting
from app.schema.video import VideoDetail, VideoList
from app.service.base import BaseService
from app.service.resource import ResourceService
from app.service.spider import SpiderService
from app.utils import cache, nfo, num_parser
from app.utils.image import save_images
from app.utils.logger import logger


def get_video_service(db: Session = Depends(get_db)):
    return VideoService(db=db)


video_cache = LRUCache(maxsize=1)


class VideoService(BaseService):
    subtitle_formats = {'.ass', '.srt'}

    @cached(cache=video_cache, key=lambda self: 'videos')
    def get_videos(self) -> List[VideoList]:
        setting = Setting().library
        video_paths = []
        for root, _, files in os.walk(setting.video_path):
            for file in files:
                path = os.path.join(root, file)
                _, ext_name = os.path.splitext(path)
                size = os.stat(path).st_size

                if ext_name in setting.video_format.split(',') and size > (setting.video_size_minimum * 1024 * 1024):
                    video_paths.append(path)

        videos = []
        for path in video_paths:
            video = nfo.get_basic(path, include_actor=True)
            if not video:
                video = VideoList(title=path.split("/")[-1], path=path)
            videos.append(video)
        return videos

    def get_videos_force(self) -> List[VideoList]:
        video_cache.pop('videos', None)
        return self.get_videos()

    def get_video(self, path: str) -> VideoDetail:
        nfo_path = nfo.get_nfo_path_by_video(path)
        detail = nfo.get_full(nfo_path)
        if not detail:
            detail = VideoDetail(path=path)
        return detail

    def parse_video(self, path: str):
        if not os.path.exists(path):
            raise BizException("视频不存在", error_code=ErrorCode.VIDEO_NOT_FOUND)
        return num_parser.parse(path)

    def batch_parse_video(self, paths: List[str]):
        result = []
        for path in paths:
            if not os.path.exists(path):
                raise BizException("视频不存在", error_code=ErrorCode.VIDEO_NOT_FOUND)
            result.append(num_parser.parse(path))
        return result

    def scrape_video(self, num: str):
        video = SpiderService(self.db).get_video_info(num)
        if not video:
            raise BizException("未找到该番号", error_code=ErrorCode.VIDEO_NUMBER_NOT_FOUND)
        return video

    def save_video(self, video: VideoDetail,
                   mode: Optional[str] = None,
                   trans_mode: Optional[str] = None):
        setting = Setting()
        if trans_mode is None:
            if mode == 'file':
                trans_mode = setting.file.trans_mode
            elif mode == 'download':
                trans_mode = setting.download.trans_mode
            elif mode == 'video':
                trans_mode = 'move'
            else:
                trans_mode = 'move'
        source_path = video.path

        video_payload = VideoSavedPayload.model_validate({
            'num': video.num,
            'cover': video.cover,
            'path': source_path,
            'is_zh': video.is_zh,
            'is_uncensored': video.is_uncensored,
            'actors': video.actors,
            'mode': mode,
            'trans_mode': trans_mode,
            'size': utils.convert_size(os.stat(source_path).st_size),
        })

        dest_path = self.trans(video, setting.library.video_path, trans_mode)
        if dest_path != source_path:
            history = History(status=1, num=video.num, is_zh=video.is_zh, is_uncensored=video.is_uncensored,
                              source_path=source_path, dest_path=dest_path, trans_method=trans_mode)
            history.add(self.db)
            self.db.commit()

            notification_manager.emit_video_saved(video_payload)

        video_cache.pop('videos', None)

    def trans(self, video: VideoDetail, video_path: str, trans_mode: str):
        if not os.path.exists(video.path):
            raise BizException('视频不存在', error_code=ErrorCode.VIDEO_NOT_FOUND)

        subtitle_paths = self.find_subtitle_paths(video.path, video.num)
        if subtitle_paths and not video.is_zh:
            logger.info(translate('log.video.subtitle_detected_mark_zh', {'num': video.num}))
            video.is_zh = True
        _, ext_name = os.path.splitext(video.path)

        if trans_mode == 'move':
            self.delete_video_meta(video.path)

        actor_folder = (",".join(map(lambda i: i.name, video.actors[0:3])) + (
            "等" if len(video.actors) > 3 else "")) if len(video.actors) > 0 else "未知演员"
        video_folder = video.title[0:80]
        save_path = os.path.join(video_path, actor_folder, video_folder)
        if not os.path.exists(save_path):
            os.makedirs(save_path)

        video_tags = []
        if video.is_uncensored:
            video_tags.append("U")
        if video.is_zh:
            video_tags.append("C")

        video_path = os.path.join(save_path, video.num + (f'-{"".join(video_tags)}' if video_tags else '') + ext_name)

        if video_path != video.path:
            if os.path.exists(video_path) and os.stat(video_path).st_size != os.stat(video.path).st_size:
                if trans_mode == 'move':
                    os.remove(video.path)
            else:
                self.transfer_file(video.path, video_path, trans_mode, f"影片《{video.num}》")
            self.trans_subtitles(video.path, video_path, subtitle_paths, trans_mode)
            utils.remove_empty_directory(video.path)

        if video.cover:
            logger.info(translate('log.video.generate_cover'))
            cover_result = ResourceService.fetch_image_file(video.cover, 'cover')
            if cover_result.file_path and os.path.exists(cover_result.file_path):
                with open(cover_result.file_path, 'rb') as file:
                    cover_data = file.read()
                save_images(video, video_path, cover_data)

        logger.info(translate('log.video.generate_nfo'))
        new_nfo_path = nfo.get_nfo_path_by_video(video_path)
        nfo.save(new_nfo_path, video)
        shutil.copy(new_nfo_path, os.path.join(save_path, 'movie.nfo'))

        logger.info(translate('log.video.save_completed'))
        return video_path

    def transfer_file(self, source_path: str, dest_path: str, trans_mode: str, file_label: str):
        trans_label = translate(f'transfer.mode.{trans_mode}', default=trans_mode)

        try:
            if trans_mode == 'move':
                logger.info(translate('log.video.transfer_started', {'action': trans_label, 'label': file_label}))
                shutil.move(source_path, dest_path)
            elif trans_mode == 'hardlink':
                logger.info(translate('log.video.hardlink_started', {'label': file_label}))
                os.link(source_path, dest_path)
            elif trans_mode == 'symlink':
                logger.info(translate('log.video.symlink_started', {'label': file_label}))
                os.symlink(source_path, dest_path)
            else:
                logger.info(translate('log.video.transfer_started', {'action': trans_label, 'label': file_label}))
                shutil.copy(source_path, dest_path)
        except OSError as exc:
            if trans_mode == 'hardlink' and exc.errno == errno.EXDEV:
                raise BizException(
                    '硬连接仅支持同一磁盘内的目录，跨盘时请改用复制或移动',
                    error_code=ErrorCode.VIDEO_TRANS_ACROSS_DISK_UNSUPPORTED,
                ) from exc
            raise

        if trans_mode in {'hardlink', 'symlink'}:
            logger.info(translate('log.video.link_created', {'label': file_label, 'action': trans_label, 'path': dest_path}))
        else:
            logger.info(translate('log.video.transfer_finished', {'action': trans_label, 'label': file_label, 'path': dest_path}))

    def delete_video(self, path):
        if not os.path.exists(path):
            raise BizException("视频不存在", error_code=ErrorCode.VIDEO_NOT_FOUND)
        self.delete_video_meta(path)
        self.delete_subtitles(path)
        os.remove(path)
        utils.remove_empty_directory(path)

        video_cache.pop('videos', None)

    def delete_video_meta(self, path):
        nfo_path = nfo.get_nfo_path_by_video(path)
        movie_nfo_path = os.path.join(os.path.split(nfo_path)[0], 'movie.nfo')
        exist = nfo.get_full(nfo_path)
        if exist:
            if os.path.exists(nfo_path):
                os.remove(nfo_path)
            if os.path.exists(movie_nfo_path):
                os.remove(movie_nfo_path)
            exist_path, _ = os.path.split(path)
            for item in ['poster', 'thumb', 'fanart']:
                image = getattr(exist, item)
                image_path = os.path.join(exist_path, image)
                if os.path.exists(image_path):
                    os.remove(image_path)

    def find_subtitle_paths(self, video_path: str, num: Optional[str]) -> list[str]:
        parent_dir = os.path.dirname(video_path)
        video_name = os.path.splitext(os.path.basename(video_path))[0]
        matched_paths: list[str] = []
        video_num = num.upper() if num else None

        for ext_name in sorted(self.subtitle_formats):
            same_name_path = os.path.join(parent_dir, f'{video_name}{ext_name}')
            if os.path.exists(same_name_path):
                matched_paths.append(same_name_path)
                continue

            if not video_num:
                continue

            ext_matches: list[str] = []
            for item in os.listdir(parent_dir):
                item_path = os.path.join(parent_dir, item)
                if not os.path.isfile(item_path):
                    continue
                _, subtitle_ext_name = os.path.splitext(item)
                if subtitle_ext_name.lower() != ext_name:
                    continue

                subtitle_meta = num_parser.parse(item_path)
                if subtitle_meta and subtitle_meta.num and subtitle_meta.num.upper() == video_num:
                    ext_matches.append(item_path)

            if ext_matches:
                ext_matches.sort(key=lambda p: (len(os.path.basename(p)), os.path.basename(p).lower()))
                if len(ext_matches) > 1:
                    logger.warning(translate(
                        'log.video.multiple_subtitle_candidates',
                        {'num': video_num, 'ext': ext_name, 'path': ext_matches[0]},
                    ))
                matched_paths.append(ext_matches[0])

        return matched_paths

    def trans_subtitles(self, source_video_path: str, dest_video_path: str, subtitle_paths: list[str], trans_mode: str):
        if not subtitle_paths:
            return

        dest_video_name = os.path.splitext(os.path.basename(dest_video_path))[0]
        dest_dir = os.path.dirname(dest_video_path)

        for subtitle_path in subtitle_paths:
            _, subtitle_ext_name = os.path.splitext(subtitle_path)
            dest_subtitle_path = os.path.join(dest_dir, f'{dest_video_name}{subtitle_ext_name.lower()}')

            if subtitle_path == dest_subtitle_path:
                continue

            if os.path.exists(dest_subtitle_path):
                if os.stat(dest_subtitle_path).st_size != os.stat(subtitle_path).st_size:
                    logger.warning(translate('log.video.subtitle_exists_size_diff', {'path': dest_subtitle_path}))
                    continue
                if trans_mode == 'move':
                    os.remove(subtitle_path)
                continue

            self.transfer_file(
                subtitle_path,
                dest_subtitle_path,
                trans_mode,
                f"字幕《{os.path.basename(subtitle_path)}》"
            )

    def delete_subtitles(self, video_path: str):
        folder_path = os.path.dirname(video_path)
        video_name = os.path.splitext(os.path.basename(video_path))[0]
        for ext_name in self.subtitle_formats:
            subtitle_path = os.path.join(folder_path, f'{video_name}{ext_name}')
            if os.path.exists(subtitle_path):
                os.remove(subtitle_path)
