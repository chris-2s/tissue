from datetime import datetime

from pydantic import BaseModel, ConfigDict


class History(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: int
    num: str | None = None
    is_zh: bool = False
    is_uncensored: bool = False
    source_path: str
    dest_path: str | None = None
    trans_method: str
    create_time: datetime | None = None
    update_time: datetime | None = None
