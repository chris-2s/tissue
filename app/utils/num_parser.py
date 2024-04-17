import os.path
import re

from app.schema import VideoDetail
from app.utils.logger import logger


def parse(path: str):
    file_name = os.path.splitext(os.path.split(path)[-1])[0]

    logger.info(f"提取文件名番号信息：{file_name}")

    video = VideoDetail(path=path)

    parts = file_name.split('@')
    for part in parts:
        video.num = parse_num(part)
        if video.num:
            video.is_zh, video.is_uncensored = parse_extra(part)
            break

    if video:
        logger.info(f"提取到番号：{video.num}, 中文：{video.is_zh}，无码：{video.is_uncensored}")
        return video
    else:
        logger.error("提取番号失败")
        return None


def parse_num(name: str):
    name = name.replace('_', '-').upper()

    matched = re.compile(r'^.+\.\d{2,4}\.\d{1,2}\.\d{1,2}').search(name)
    if matched:
        return matched.group(0)

    matched = re.compile(r'^[\w.]+-(\w+-\w+)(-\w+)*-(1080P|FHD)').search(name)
    if matched:
        return matched.group(1)

    matched = re.compile(r'^(\w+-\w+?)(-C|CH)').search(name)
    if matched:
        return matched.group(1)

    matched = re.compile(r'^(\w+\s?-\s?\w+)[\w.]?').search(name)
    if matched:
        return matched.group(1).replace(' ', '')


def parse_extra(name: str):
    name = name.replace('_', '-').replace(' ', '').upper()
    is_zh = False
    is_uncensored = False
    if name.endswith('CH') or name.endswith('-C') or name.endswith('-UC'):
        is_zh = True

    if name.endswith('uncensored') or name.endswith('-UC') or name.endswith('-U'):
        is_uncensored = True
    return is_zh, is_uncensored


if __name__ == '__main__':
    print(parse('/ss/therealworkout.24.02.02.octavia.red.work.those.curves.mp4'))
    print(parse('/ss/BangBros18.19.09.17.abcd.mp4'))
    print(parse('/ss/carib-020924-001-FHD.mp4'))
    print(parse('/ss/@江南@jn998.vip-020624_001-1pon-1080p.mp4'))
    print(parse('/ss/paco-012024_973-1080p.mp4'))
    print(parse('/ss/aavv39.xyz@020924-001-carib.mp4'))
    print(parse('/ss/mkbd-s120.mp4'))
    print(parse('/ss/CAWD-621-C.mp4'))
    print(parse('/ss/midv-639ch.mp4'))
    print(parse('/ss/www.freedl.org@200GANA-1921.mp4'))
