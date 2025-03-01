from datetime import datetime, date
from typing import Optional

from pydantic import BaseModel, ConfigDict


class SubscribeCreate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    num: str
    premiered: Optional[date] = None
    title: Optional[str] = None
    cover: Optional[str] = None
    actors: Optional[str] = None
    is_hd: bool = False
    is_zh: bool = False
    is_uncensored: bool = False


class SubscribeUpdate(SubscribeCreate):
    id: int


class Subscribe(SubscribeUpdate):
    last_updated: Optional[datetime] = None


class SubscribeNotify(SubscribeCreate):
    name: Optional[str] = None
    website: Optional[str] = None
    url: Optional[str] = None
    size: Optional[str] = None
    magnet: Optional[str] = None
    publish_date: str = None
