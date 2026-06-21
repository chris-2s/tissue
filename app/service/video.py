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
from app.schema import VideoList, VideoDetail, Setting, VideoNotify
from app.service.base import BaseService
from app.service.spider import SpiderService
from app.utils import nfo, spider, num_parser, cache, notify
from app.utils.image import save_images
from app.utils.logger import logger


def get_video_service(db: Session = Depends(get_db)):
    return VideoService(db=db)


video_cache = LRUCache(maxsize=1)


class VideoService(BaseService):

    subtitle_formats = {'.ass', '.srt'}
    trans_mode_labels = {
        'copy': '复制',
        'move': '移动',
        'hardlink': '硬连接',
        'symlink': '软连接',
    }

    @cached(cache=video_cache, key=lambda self: 'videos')
    def get_videos(self) -> List[VideoList]:
        setting = Setting().app
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
        video_cache.pop('videos')
        return self.get_videos()

    def get_video(self, path: str) -> VideoDetail:
        nfo_path = nfo.get_nfo_path_by_video(path)
        detail = nfo.get_full(nfo_path)
        if not detail:
            detail = VideoDetail(path=path)
        return detail

    def parse_video(self, path: str):
        if not os.path.exists(path):
            raise BizException("视频不存在")
        return num_parser.parse(path)

    def batch_parse_video(self, paths: List[str]):
        result = []
        for path in paths:
            if not os.path.exists(path):
                raise BizException(f"视频${path}不存在")
            result.append(num_parser.parse(path))
        return result

    def scrape_video(self, num: str):
        video = SpiderService(self.db).get_video_info(num)
        if not video:
            raise BizException("未找到该番号")

        cache.clean_cache_file('cover', video.cover)
        for actor in video.actors:
            cache.clean_cache_file('cover', actor.thumb)

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
            else:
                trans_mode = 'move'
        source_path = video.path

        video_notify = VideoNotify(**video.model_dump())
        video_notify.mode = mode
        video_notify.trans_mode = trans_mode
        video_notify.size = utils.convert_size(os.stat(source_path).st_size)

        dest_path = self.trans(video, setting.app.video_path, trans_mode)
        if dest_path != source_path:
            history = History(status=1, num=video.num, is_zh=video.is_zh, is_uncensored=video.is_uncensored,
                              source_path=source_path, dest_path=dest_path, trans_method=trans_mode)
            history.add(self.db)
            self.db.commit()

            video_notify.is_success = True
            notify.send_video(video_notify)

        video_cache.pop('videos', None)

    def trans(self, video: VideoDetail, video_path: str, trans_mode: str):
        if not os.path.exists(video.path):
            raise BizException('视频不存在')

        subtitle_paths = self.find_subtitle_paths(video.path, video.num)
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
            logger.info(f"生成封面及水印图片")
            cover_data = SpiderService.get_video_cover(video.cover)
            save_images(video, video_path, cover_data)

        logger.info(f"生成NFO文件")
        new_nfo_path = nfo.get_nfo_path_by_video(video_path)
        nfo.save(new_nfo_path, video)
        shutil.copy(new_nfo_path, os.path.join(save_path, 'movie.nfo'))

        logger.info(f"影片保存完成")
        return video_path

    def transfer_file(self, source_path: str, dest_path: str, trans_mode: str, file_label: str):
        trans_label = self.trans_mode_labels.get(trans_mode, trans_mode)

        try:
            if trans_mode == 'move':
                logger.info(f"开始{trans_label}{file_label}...")
                shutil.move(source_path, dest_path)
            elif trans_mode == 'hardlink':
                logger.info(f"开始创建{file_label}硬连接...")
                os.link(source_path, dest_path)
            elif trans_mode == 'symlink':
                logger.info(f"开始创建{file_label}软连接...")
                os.symlink(source_path, dest_path)
            else:
                logger.info(f"开始{trans_label}{file_label}...")
                shutil.copy(source_path, dest_path)
        except OSError as exc:
            if trans_mode == 'hardlink' and exc.errno == errno.EXDEV:
                raise BizException('硬连接仅支持同一磁盘内的目录，跨盘时请改用复制或移动') from exc
            raise

        if trans_mode in {'hardlink', 'symlink'}:
            logger.info(f"{file_label}{trans_label}创建完成: {dest_path}")
        else:
            logger.info(f"{trans_label}{file_label}完成: {dest_path}")

    def delete_video(self, path):
        if not os.path.exists(path):
            raise BizException("视频不存在")
        self.delete_video_meta(path)
        self.delete_subtitles(path)
        os.remove(path)
        utils.remove_empty_directory(path)

        video_cache.pop('videos', None)

    def delete_video_meta(self, path):
        nfo_path = nfo.get_nfo_path_by_video(path)
        movie_nfo_path = os.path.join(os.path.split(nfo_path)[0],'movie.nfo')
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
                    logger.warning(f"影片《{video_num}》存在多个{ext_name}字幕候选，使用：{ext_matches[0]}")
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
                    logger.warning(f"字幕文件已存在且大小不同，跳过：{dest_subtitle_path}")
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
