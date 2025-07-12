from sqlalchemy import Column, Integer, String, Boolean

from app.db.models.base import Base


class Site(Base):
    __tablename__ = 'site'

    id = Column(Integer, primary_key=True, autoincrement=True)
    class_str = Column(String, nullable=False)
    priority = Column(Integer, nullable=False)
    alternate_host = Column(String, nullable=True)
    status = Column(Boolean, nullable=True)
