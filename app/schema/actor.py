from typing import Optional, List

from pydantic import BaseModel, Field

from app.schema.home import SiteVideo
from app.schema.r import Page
from app.schema.video import SourceRef


class ImageInfo(BaseModel):
    width: Optional[int] = None
    height: Optional[int] = None
    mime: Optional[str] = None


class Actor(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    thumb: Optional[str] = None
    thumb_info: Optional[ImageInfo] = None
    alias: List[str] = Field(default_factory=list)

    source: SourceRef


class ActorPage(BaseModel):
    actor: Actor
    page: Page[list[SiteVideo]]
    is_favorite: bool = False


class ActorFavoriteCreate(BaseModel):
    site_id: int
    actor_code: str
    actor_name: Optional[str] = None
    actor_thumb: Optional[str] = None
    actor_alias: List[str] = Field(default_factory=list)


class ActorFavorite(ActorFavoriteCreate):
    id: int
    actor: Actor
