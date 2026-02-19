from enum import StrEnum
from typing import Optional

from pydantic import BaseModel


class SpiderKey(StrEnum):
    JAVDB = 'javdb'
    JAVBUS = 'javbus'
    JAV321 = 'jav321'
    DMM = 'dmm'


class SiteCapabilities(BaseModel):
    supports_ranking: bool
    supports_actor: bool
    supports_login: bool
    supports_downloads: bool
    supports_previews: bool
    supports_comments: bool


class Site(BaseModel):
    id: int
    spider_key: SpiderKey
    name: str
    priority: int
    alternate_host: Optional[str]
    status: Optional[bool]
    cookies: Optional[str]
    capabilities: SiteCapabilities


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
