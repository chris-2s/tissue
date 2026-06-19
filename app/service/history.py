from fastapi import Depends
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.db import get_db
from app.db.models import History
from app.db.transaction import transaction
from app.service.base import BaseService
from app.schema.r import Page


def get_history_service(db: Session = Depends(get_db)):
    return HistoryService(db)


class HistoryService(BaseService):

    def get_histories(self, page: int = 1, limit: int = 20, keyword: str | None = None):
        query = self.db.query(History)

        if keyword:
            pattern = f"%{keyword.strip()}%"
            query = query.filter(or_(
                History.num.like(pattern),
                History.source_path.like(pattern),
                History.dest_path.like(pattern),
            ))

        total = query.count()
        histories = query.order_by(History.id.desc()).offset((page - 1) * limit).limit(limit).all()
        return Page(page=page, limit=limit, total=total, data=histories)

    @transaction
    def delete_history(self, history_id: int):
        history = History.get(self.db, history_id)
        if history is not None:
            history.delete(self.db)
