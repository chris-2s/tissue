from datetime import datetime
from pydantic import BaseModel


class ApiKeyBase(BaseModel):
    name: str


class ApiKeyCreate(ApiKeyBase):
    pass


class ApiKeyUpdate(BaseModel):
    name: str | None = None
    enabled: bool | None = None


class ApiKeyOut(BaseModel):
    id: int
    user_id: int
    name: str
    key: str
    enabled: bool
    create_time: datetime | None = None


class ApiKeyCreateOut(BaseModel):
    id: int
    user_id: int
    name: str
    key: str
    enabled: bool
    create_time: datetime | None = None
