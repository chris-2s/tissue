from sqlalchemy import Column, Integer, String, Text, UniqueConstraint

from app.db.models.base import Base


class ActorFavorite(Base):
    __tablename__ = 'actor_favorite'
    __table_args__ = (
        UniqueConstraint('site_id', 'actor_code', name='uq_actor_favorite_site_code'),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    site_id = Column(Integer, nullable=False)
    actor_code = Column(String, nullable=False)
    actor_name = Column(String, nullable=True)
    actor_thumb = Column(String, nullable=True)
    actor_alias = Column(Text, nullable=True)
