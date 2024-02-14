from typing import List

from pydantic import BaseModel


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
    files: List[TorrentFile] = []
