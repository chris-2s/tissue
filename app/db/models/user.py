from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import Session

from app.db.models.base import Base
from app.utils.security import verify_password, create_access_token


class User(Base):
    __tablename__ = 'user'

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    username = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    is_admin = Column(Boolean, nullable=False, default=False)

    @staticmethod
    def verify(db: Session, username: str, password: str):
        user = db.query(User).filter_by(username=username).one_or_none()
        if not user:
            return None
        if not verify_password(password, user.password):
            return None
        return create_access_token(user.id)

    @staticmethod
    def get_by_username(db: Session, username: str):
        return db.query(User).filter_by(username=username).one_or_none()
