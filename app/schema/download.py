from typing import List

from pydantic import BaseModel, Field


class TorrentFile(BaseModel):
    name: str
    size: str
    path: str


class Torrent(BaseModel):
    hash: str
    name: str
    size: str
    path: str
    tags: List[str]
    files: List[TorrentFile] = Field(default_factory=list)
