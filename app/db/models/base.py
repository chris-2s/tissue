from datetime import datetime
from typing import Self, Any

from sqlalchemy import Column, Integer, DateTime, inspect, event
from sqlalchemy.orm import Session, as_declarative

from app.middleware.requestvars import g


@as_declarative()
class Base:
    id: Any
    __tablename__: str

    create_by = Column(Integer, nullable=True)
    create_time = Column(DateTime(timezone=True), nullable=True)
    update_by = Column(Integer, nullable=True)
    update_time = Column(DateTime(timezone=True), nullable=True)

    @classmethod
    def get(cls, db: Session, rid: int) -> Self:
        return db.query(cls).filter(cls.id == rid).first()

    @classmethod
    def list(cls, db: Session) -> list[Self]:
        return db.query(cls).all()

    def add(self, db: Session):
        db.add(self)
        return self

    def update(self, db: Session, payload: dict):
        for key, value in payload.items():
            setattr(self, key, value)
        if inspect(self).detached:
            db.add(self)
        return self

    def delete(self, db: Session) -> None:
        db.delete(self)


@event.listens_for(Base, 'before_insert', propagate=True)
def before_insert(mapper, connection, target: Base):
    if hasattr(g(), 'current_user_id'):
        target.create_by = g().current_user_id
    target.create_time = datetime.now()


@event.listens_for(Base, 'before_update', propagate=True)
def before_update(mapper, connection, target: Base):
    if hasattr(g(), 'current_user_id'):
        target.update_by = g().current_user_id
    target.update_time = datetime.now()
