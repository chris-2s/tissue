from typing import Optional

from pydantic import BaseModel


class HomeSystem(BaseModel):
    cpu_percent: float
    memory_total: str
    memory_available: str


class HomeDisk(BaseModel):
    video: str
    file: str
    download: Optional[str] = None


class HomeDownload(BaseModel):
    upload_speed: str
    download_speed: str
