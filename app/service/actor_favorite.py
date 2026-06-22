import json

from fastapi import Depends
from sqlalchemy.orm import Session

from app import schema
from app.db import get_db
from app.db.models import ActorFavorite as ActorFavoriteModel, Site
from app.db.transaction import transaction
from app.exception import BizException
from app.service.base import BaseService
from app.service.spider import SpiderService


def get_actor_favorite_service(db: Session = Depends(get_db)):
    return ActorFavoriteService(db=db)


class ActorFavoriteService(BaseService):

    def list_favorites(self) -> list[schema.ActorFavorite]:
        favorites = self.db.query(ActorFavoriteModel).order_by(ActorFavoriteModel.id.desc()).all()
        return [self._to_schema(item) for item in favorites]

    def is_favorite(self, site_id: int, actor_code: str) -> bool:
        if not actor_code:
            return False
        return self.db.query(ActorFavoriteModel).filter(
            ActorFavoriteModel.site_id == site_id,
            ActorFavoriteModel.actor_code == actor_code,
        ).first() is not None

    @transaction
    def add_favorite(self, param: schema.ActorFavoriteCreate):
        exist = self.db.query(ActorFavoriteModel).filter(
            ActorFavoriteModel.site_id == param.site_id,
            ActorFavoriteModel.actor_code == param.actor_code,
        ).first()
        if exist:
            raise BizException('已收藏该演员')

        favorite = ActorFavoriteModel(
            site_id=param.site_id,
            actor_code=param.actor_code,
            actor_name=param.actor_name,
            actor_thumb=param.actor_thumb,
            actor_alias=json.dumps(param.actor_alias, ensure_ascii=False),
        )
        favorite.add(self.db)
        self.db.flush()
        return self._to_schema(favorite)

    @transaction
    def delete_favorite(self, favorite_id: int):
        exist = ActorFavoriteModel.get(self.db, favorite_id)
        if not exist:
            raise BizException('该收藏不存在')
        exist.delete(self.db)

    def _to_schema(self, model: ActorFavoriteModel) -> schema.ActorFavorite:
        spider = SpiderService(self.db).build_spider_by_site_id(model.site_id, include_cookies=False)
        if not spider:
            site = Site.get(self.db, model.site_id)
            if not site:
                raise BizException('收藏对应站点不存在')
            source = schema.SourceRef(site_id=model.site_id, spider_key=site.spider_key, site_name=site.spider_key)
        else:
            source = spider.source_ref()

        actor_alias = self._load_alias(model.actor_alias)
        actor = schema.Actor(
            code=model.actor_code,
            name=model.actor_name,
            thumb=model.actor_thumb,
            alias=actor_alias,
            source=source,
        )
        return schema.ActorFavorite(
            id=model.id,
            site_id=model.site_id,
            actor_code=model.actor_code,
            actor_name=model.actor_name,
            actor_thumb=model.actor_thumb,
            actor_alias=actor_alias,
            actor=actor,
        )

    @staticmethod
    def _load_alias(raw_alias: str | None) -> list[str]:
        if not raw_alias:
            return []
        try:
            value = json.loads(raw_alias)
        except json.JSONDecodeError:
            return []
        return value if isinstance(value, list) else []
