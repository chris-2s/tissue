from typing import Optional

from pydantic import BaseModel


class HomeMemory(BaseModel):
    total: float
    available: float


class HomeDisk(BaseModel):
    total: float
    available: float
    type: str


class HomeDownload(BaseModel):
    upload_speed: float
    download_speed: float
