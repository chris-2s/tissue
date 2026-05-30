from sqlalchemy import Boolean, Column, ForeignKey, Integer, String
from sqlalchemy.orm import Session

from app.db.models.base import Base


class ApiKey(Base):
    __tablename__ = "api_key"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("user.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    api_key = Column(String, nullable=False, unique=True, index=True)
    enabled = Column(Boolean, nullable=False, default=True, index=True)

    @staticmethod
    def get_by_key(db: Session, key: str):
        return db.query(ApiKey).filter_by(api_key=key).one_or_none()

    @staticmethod
    def list_by_user_id(db: Session, user_id: int):
        return db.query(ApiKey).filter_by(user_id=user_id).order_by(ApiKey.id.desc()).all()

