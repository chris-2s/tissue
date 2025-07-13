from typing import Optional

from pydantic import BaseModel


class Site(BaseModel):
    id: int
    name: str
    priority: int
    alternate_host: Optional[str]
    status: Optional[bool]

    downloadable: bool

class SiteUpdate(BaseModel):
    id: int
    priority: int
    alternate_host: Optional[str]
    status: Optional[bool]