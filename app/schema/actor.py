from typing import Optional, List

from pydantic import BaseModel

from app.schema import SourceRef


class Actor(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    thumb: Optional[str] = None
    alias: Optional[List[str]] = []

    source: SourceRef

