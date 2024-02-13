from typing import Optional

from pydantic import BaseModel


class UserBase(BaseModel):
    name: str
    username: str


class UserCreate(UserBase):
    password: str


class UserUpdate(UserBase):
    id: int
    password: Optional[str] = None


class User(UserBase):
    id: int
    is_admin: bool
