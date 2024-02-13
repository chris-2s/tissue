from pydantic import BaseModel


class File(BaseModel):
    name: str
    path: str
    size: str
