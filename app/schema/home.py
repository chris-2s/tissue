from datetime import date
from typing import Optional

from pydantic import BaseModel


class JavDBRanking(BaseModel):
    cover: Optional[str] = None
    num: Optional[str] = None
    title: Optional[str] = None
    publish_date: Optional[date] = None
    rank: Optional[float] = None
    rank_count: Optional[int] = None
    isZh: Optional[bool] = False
    url: Optional[str] = None
