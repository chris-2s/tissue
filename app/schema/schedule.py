from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class Schedule(BaseModel):
    key: str
    name: str
    status: Optional[str] = None
    next_run_time: Optional[datetime] = None
