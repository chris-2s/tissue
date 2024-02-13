from fastapi import Depends
from sqlalchemy.orm import Session

from app.db import get_db


class BaseService:
    def __init__(self, db: Session):
        self.db = db


def get_service(cls: BaseService.__class__):
    def wrapper(db: Session = Depends(get_db)):
        return cls(db)
    return wrapper
