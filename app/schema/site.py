from typing import Optional

from pydantic import BaseModel


class Site(BaseModel):
    id: int
    name: str
    priority: int
    alternate_host: Optional[str]
    status: Optional[bool]
    cookies: Optional[str]

    downloadable: bool


class SiteUpdate(BaseModel):
    id: int
    priority: int
    alternate_host: Optional[str]
    status: Optional[bool]
    cookies: Optional[str]


class LoginSubmit(BaseModel):
    cookies: str
    authenticity_token: str
    username: str
    password: str
    captcha: str