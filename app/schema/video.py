from typing import Optional, List

from pydantic import BaseModel


class VideoActor(BaseModel):
    name: Optional[str] = None
    thumb: Optional[str] = None


class VideoList(BaseModel):
    title: str
    path: str
    cover: Optional[str] = None
    is_zh: bool = False
    is_uncensored: bool = False

    actors: List[VideoActor] = []


class VideoDetail(BaseModel):
    # 标题
    title: Optional[str] = None
    # 番号
    num: Optional[str] = None
    # 评分
    rating: Optional[str] = None
    # 发行时间
    premiered: Optional[str] = None
    # 大纲
    outline: Optional[str] = None
    # 时长
    runtime: Optional[str] = None
    # 导演
    director: Optional[str] = None
    # 演员
    actors: Optional[List[VideoActor]] = []
    # 制造商
    studio: Optional[str] = None
    # 发行商
    publisher: Optional[str] = None
    # 类别
    tags: Optional[List[str]] = []
    # 系列
    series: Optional[str] = None
    # 封面
    cover: Optional[str] = None
    poster: Optional[str] = None
    fanart: Optional[str] = None
    thumb: Optional[str] = None
    # 页面
    website: Optional[List[str]] = []
    # 路径
    path: Optional[str] = None
    # 是否中文
    is_zh: bool = False
    # 是否无码
    is_uncensored: bool = False


class VideoNotify(VideoDetail):
    is_success: bool = True
    mode: Optional[str] = None
    trans_mode: Optional[str] = None
    torrent_hash: Optional[str] = None
    size: Optional[str] = None
    message: Optional[str] = None
