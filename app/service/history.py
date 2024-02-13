from fastapi import Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.db.models import History
from app.db.transaction import transaction
from app.service.base import BaseService


def get_history_service(db: Session = Depends(get_db)):
    return HistoryService(db)


class HistoryService(BaseService):

    def get_histories(self):
        return self.db.query(History).order_by(History.id.desc()).all()

    @transaction
    def delete_history(self, history_id: int):
        history = History.get(self.db, history_id)
        if history is not None:
            history.delete(self.db)
