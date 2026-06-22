import os.path

from app.schema import VideoDetail
from app.utils.logger import logger
from app.utils.media_matcher import parse_path


def parse(path: str):
    file_name = os.path.splitext(os.path.split(path)[-1])[0]

    logger.debug(f"提取文件名番号信息：{file_name}")

    video = VideoDetail(path=path)

    result = parse_path(path)
    video.num = result.num.value
    video.is_zh = result.is_zh.value
    video.is_uncensored = result.is_uncensored.value

    if video.num:
        logger.debug(f"提取到番号：{video.num}, 中文：{video.is_zh}，无码：{video.is_uncensored}")
        return video
    else:
        logger.warning(f"提取番号失败：{file_name}")
        return None


def parse_num(name: str):
    return parse_path(name).num.value


def parse_extra(name: str):
    result = parse_path(name)
    return result.is_zh.value, result.is_uncensored.value
