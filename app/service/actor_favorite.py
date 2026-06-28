import json
import time
import traceback
from random import randint

from fastapi import Depends
from sqlalchemy.orm import Session

from app import schema
from app.db import get_db, SessionFactory
from app.db.models import ActorFavorite as ActorFavoriteModel, Site
from app.db.transaction import transaction
from app.exception import BizException
from app.exception.codes import ErrorCode
from app.i18n import translate
from app.service.base import BaseService
from app.service.spider import SpiderService
from app.utils.logger import logger


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
            raise BizException('演员已收藏', error_code=ErrorCode.ACTOR_ALREADY_FAVORITED)

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
            raise BizException('演员收藏不存在', error_code=ErrorCode.ACTOR_FAVORITE_NOT_FOUND)
        exist.delete(self.db)

    def _to_schema(self, model: ActorFavoriteModel) -> schema.ActorFavorite:
        spider = SpiderService(self.db).build_spider_by_site_id(model.site_id, include_cookies=False)
        if not spider:
            site = Site.get(self.db, model.site_id)
            if not site:
                raise BizException('收藏对应站点不存在', error_code=ErrorCode.ACTOR_FAVORITE_SITE_NOT_FOUND)
            source = schema.SourceRef(site_id=model.site_id, spider_key=site.spider_key, site_name=site.spider_key)
        else:
            try:
                source = spider.source_ref()
            finally:
                spider.close()

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

    @classmethod
    def job_refresh_missing_thumb(cls):
        with SessionFactory() as db:
            favorite_rows = db.query(
                ActorFavoriteModel.id,
                ActorFavoriteModel.site_id,
                ActorFavoriteModel.actor_code,
            ).filter(
                (ActorFavoriteModel.actor_thumb.is_(None)) | (ActorFavoriteModel.actor_thumb == '')
            ).order_by(ActorFavoriteModel.id.desc()).all()

        logger.info(translate('log.actor_favorite.missing_thumb_count', {'count': len(favorite_rows)}))
        for favorite_id, site_id, actor_code in favorite_rows:
            actor_label = actor_code
            try:
                with SessionFactory() as db:
                    favorite = ActorFavoriteModel.get(db, favorite_id)
                    if not favorite:
                        logger.warning(translate('log.actor_favorite.not_found_skip_refresh', {'actor_code': actor_code}))
                        continue

                    actor_label = favorite.actor_name or favorite.actor_code
                    actor_page = SpiderService(db).get_actor_page(site_id, actor_code, 1)
                    actor = actor_page.actor
                    updated = False

                    if actor.thumb and actor.thumb != favorite.actor_thumb:
                        favorite.actor_thumb = actor.thumb
                        updated = True
                    if actor.name and actor.name != favorite.actor_name:
                        favorite.actor_name = actor.name
                        updated = True
                    if actor.alias:
                        alias_payload = json.dumps(actor.alias, ensure_ascii=False)
                        if alias_payload != favorite.actor_alias:
                            favorite.actor_alias = alias_payload
                            updated = True

                    if updated:
                        db.add(favorite)
                        db.commit()
                        logger.info(translate('log.actor_favorite.thumb_refreshed', {'actor_label': actor_label}))
                    else:
                        logger.info(translate('log.actor_favorite.no_update_available', {'actor_label': actor_label}))
            except Exception:
                logger.error(translate('log.actor_favorite.refresh_failed', {'actor_label': actor_label}))
                traceback.print_exc()

            time.sleep(randint(30, 60))
