from pydantic import BaseModel


class CrawlerCapabilities(BaseModel):
    supports_ranking: bool = False
    supports_actor: bool = False
    supports_login: bool = False
    supports_downloads: bool = False
    supports_previews: bool = False
    supports_comments: bool = False
