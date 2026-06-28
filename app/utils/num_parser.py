import os.path

from app.i18n import translate
from app.schema import VideoDetail
from app.utils.logger import logger
from app.utils.media_matcher import parse_path


def parse(path: str):
    file_name = os.path.splitext(os.path.split(path)[-1])[0]

    logger.debug(translate('log.num_parser.parse_started', {'file_name': file_name}))

    video = VideoDetail(path=path)

    result = parse_path(path)
    video.num = result.num.value
    video.is_zh = result.is_zh.value
    video.is_uncensored = result.is_uncensored.value

    if video.num:
        logger.debug(translate(
            'log.num_parser.parse_succeeded',
            {'num': video.num, 'is_zh': video.is_zh, 'is_uncensored': video.is_uncensored},
        ))
        return video
    else:
        logger.warning(translate('log.num_parser.parse_failed', {'file_name': file_name}))
        return None


def parse_num(name: str):
    return parse_path(name).num.value


def parse_extra(name: str):
    result = parse_path(name)
    return result.is_zh.value, result.is_uncensored.value
