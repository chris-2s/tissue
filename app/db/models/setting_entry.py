from sqlalchemy import Column, Integer, String, Text, UniqueConstraint

from app.db.models.base import Base


class SettingEntry(Base):
    __tablename__ = 'settings'
    __table_args__ = (
        UniqueConstraint('namespace', name='uq_settings_namespace'),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    namespace = Column(String, nullable=False)
    version = Column(Integer, nullable=False, default=1)
    payload = Column(Text, nullable=False)
