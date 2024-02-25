from sqlalchemy import Column, Integer, String, DateTime, Boolean, Date

from app.db.models.base import Base


class Subscribe(Base):
    __tablename__ = 'subscribe'

    id = Column(Integer, primary_key=True, autoincrement=True)
    num = Column(String, nullable=False)
    premiered = Column(Date, nullable=True)
    title = Column(String, nullable=True)
    cover = Column(String, nullable=True)
    actors = Column(String, nullable=True)
    last_updated = Column(DateTime, nullable=True)
    is_hd = Column(Boolean, nullable=False, default=True)
    is_zh = Column(Boolean, nullable=False, default=False)
    is_uncensored = Column(Boolean, nullable=False, default=False)
