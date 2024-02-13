from sqlalchemy import Column, Integer, String, Boolean

from app.db.models.base import Base


class History(Base):
    __tablename__ = 'history'

    id = Column(Integer, primary_key=True, autoincrement=True)
    status = Column(Integer, nullable=False, default=1)
    num = Column(String, nullable=True)
    is_zh = Column(Boolean, nullable=False, default=False)
    is_uncensored = Column(Boolean, nullable=False, default=False)
    source_path = Column(String, nullable=False)
    dest_path = Column(String, nullable=True)
    trans_method = Column(String, nullable=False)
