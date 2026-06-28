from datetime import date
from typing import Optional

from pydantic import BaseModel, Field

from app.schema.video import SourceRef, VideoActor


class VideoSavedPayload(BaseModel):
    num: Optional[str] = None
    cover: Optional[str] = None
    path: Optional[str] = None
    is_zh: bool = False
    is_uncensored: bool = False
    actors: list[VideoActor] = Field(default_factory=list)
    mode: Optional[str] = None
    trans_mode: Optional[str] = None
    size: Optional[str] = None


class VideoFailedPayload(BaseModel):
    num: Optional[str] = None
    cover: Optional[str] = None
    path: Optional[str] = None
    is_zh: bool = False
    is_uncensored: bool = False
    size: Optional[str] = None
    message: Optional[str] = None


class SubscribeStartedPayload(BaseModel):
    num: str
    cover: Optional[str] = None
    actors: Optional[str] = None
    is_hd: bool = False
    is_zh: bool = False
    is_uncensored: bool = False
    name: Optional[str] = None
    url: Optional[str] = None
    size: Optional[str] = None
    publish_date: Optional[date] = None
    source: Optional[SourceRef] = None


class CookieInvalidPayload(BaseModel):
    site_name: str
    domain: str
    message: str
