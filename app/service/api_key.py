import secrets

from fastapi import Depends
from sqlalchemy.orm import Session

from app import schema
from app.db import get_db
from app.db.models.api_key import ApiKey
from app.db.transaction import transaction
from app.exception import BizException
from app.service.base import BaseService


def get_api_key_service(db: Session = Depends(get_db)):
    return ApiKeyService(db)


class ApiKeyService(BaseService):

    @staticmethod
    def _mask_key(raw_key: str) -> str:
        if len(raw_key) <= 8:
            return "****"
        return f"{raw_key[:4]}...{raw_key[-4:]}"

    def _generate_unique_api_key(self) -> str:
        for _ in range(5):
            candidate = secrets.token_urlsafe(32)
            exist = ApiKey.get_by_key(self.db, candidate)
            if not exist:
                return candidate
        raise BizException("API Key 生成失败，请重试")

    def list_api_keys(self, user_id: int):
        keys = ApiKey.list_by_user_id(self.db, user_id)
        return [
            schema.ApiKeyOut(
                id=item.id,
                user_id=item.user_id,
                name=item.name,
                key=self._mask_key(item.api_key),
                enabled=item.enabled,
                create_time=item.create_time,
            ) for item in keys
        ]

    @transaction
    def create_api_key(self, user_id: int, params: schema.ApiKeyCreate):
        raw_key = self._generate_unique_api_key()
        record = ApiKey(user_id=user_id, name=params.name, api_key=raw_key, enabled=True)
        record.add(self.db)
        self.db.flush()
        return schema.ApiKeyCreateOut(
            id=record.id,
            user_id=record.user_id,
            name=record.name,
            key=raw_key,
            enabled=record.enabled,
            create_time=record.create_time,
        )

    @transaction
    def update_api_key(self, user_id: int, api_key_id: int, params: schema.ApiKeyUpdate):
        record = ApiKey.get(self.db, api_key_id)
        if not record:
            raise BizException("API Key 不存在")
        if record.user_id != user_id:
            raise BizException("无权限操作该 API Key")
        payload = params.model_dump(exclude_none=True)
        if not payload:
            return
        record.update(self.db, payload)

    @transaction
    def delete_api_key(self, user_id: int, api_key_id: int):
        record = ApiKey.get(self.db, api_key_id)
        if not record:
            raise BizException("API Key 不存在")
        if record.user_id != user_id:
            raise BizException("无权限操作该 API Key")
        record.delete(self.db)
