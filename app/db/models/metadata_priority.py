from sqlalchemy import Column, Integer, String, UniqueConstraint

from app.db.models.base import Base


class MetadataPriority(Base):
    __tablename__ = 'metadata_priority'
    __table_args__ = (
        UniqueConstraint('field_key', 'spider_key', name='uq_metadata_priority_field_spider'),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    field_key = Column(String, nullable=False)
    spider_key = Column(String, nullable=False)
    priority = Column(Integer, nullable=False)
