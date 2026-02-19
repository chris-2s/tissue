from pydantic import BaseModel


class CookieNotify(BaseModel):
    site_name: str
    domain: str
    message: str
