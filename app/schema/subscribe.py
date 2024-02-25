from datetime import datetime, date
from typing import Optional

from pydantic import BaseModel


class SubscribeCreate(BaseModel):
    num: str
    premiered: Optional[date] = None
    title: Optional[str] = None
    cover: Optional[str] = None
    actors: Optional[str] = None
    is_hd: bool = True
    is_zh: bool = False
    is_uncensored: bool = False


class SubscribeUpdate(SubscribeCreate):
    id: int


class Subscribe(SubscribeUpdate):
    last_updated: Optional[datetime] = None
