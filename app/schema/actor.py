from typing import Optional, List

from pydantic import BaseModel

from app.schema import SourceRef


class ImageInfo(BaseModel):
    width: Optional[int] = None
    height: Optional[int] = None
    mime: Optional[str] = None


class Actor(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    thumb: Optional[str] = None
    thumb_info: Optional[ImageInfo] = None
    alias: Optional[List[str]] = []

    source: SourceRef
