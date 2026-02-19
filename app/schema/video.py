from datetime import date
from typing import Optional, List

from pydantic import BaseModel, Field


class VideoActor(BaseModel):
    name: Optional[str] = None
    thumb: Optional[str] = None
    code: Optional[str] = None


class SourceRef(BaseModel):
    site_id: int
    spider_key: str
    site_name: str


class VideoList(BaseModel):
    title: str
    path: str
    num: Optional[str] = None
    cover: Optional[str] = None
    is_zh: bool = False
    is_uncensored: bool = False

    actors: List[VideoActor] = Field(default_factory=list)


class VideoDownload(BaseModel):
    is_hd: bool = False
    is_zh: bool = False
    is_uncensored: bool = False

    name: Optional[str] = None
    source: SourceRef
    url: Optional[str] = None
    size: Optional[str] = None
    magnet: Optional[str] = None
    publish_date: Optional[date] = None


class VideoPreviewItem(BaseModel):
    type: Optional[str] = None
    thumb: Optional[str] = None
    url: Optional[str] = None


class VideoPreview(BaseModel):
    source: SourceRef
    items: List[VideoPreviewItem] = Field(default_factory=list)


class VideoCommentItem(BaseModel):
    id: str
    name: Optional[str] = None
    score: Optional[float] = None
    publish_date: Optional[date] = None
    content: Optional[str] = None
    likes: Optional[int] = None


class VideoComment(BaseModel):
    source: SourceRef
    items: List[VideoCommentItem] = Field(default_factory=list)


class VideoSiteActor(BaseModel):
    source: SourceRef
    items: List[VideoActor] = Field(default_factory=list)


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
    actors: List[VideoActor] = Field(default_factory=list)
    # 制造商
    studio: Optional[str] = None
    # 发行商
    publisher: Optional[str] = None
    # 类别
    tags: List[str] = Field(default_factory=list)
    # 系列
    series: Optional[str] = None
    # 封面
    cover: Optional[str] = None
    poster: Optional[str] = None
    fanart: Optional[str] = None
    thumb: Optional[str] = None
    # 页面
    website: List[str] = Field(default_factory=list)
    # 路径
    path: Optional[str] = None
    # 是否中文
    is_zh: bool = False
    # 是否无码
    is_uncensored: bool = False

    # 下载列表
    downloads: List[VideoDownload] = Field(default_factory=list)
    # 预览列表
    previews: List[VideoPreview] = Field(default_factory=list)
    # 评论
    comments: List[VideoComment] = Field(default_factory=list)
    # 站点演员
    site_actors: List[VideoSiteActor] = Field(default_factory=list)


class VideoNotify(VideoDetail):
    is_success: bool = True
    mode: Optional[str] = None
    trans_mode: Optional[str] = None
    torrent_hash: Optional[str] = None
    size: Optional[str] = None
    message: Optional[str] = None
