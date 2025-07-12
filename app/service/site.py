from app import schema

from fastapi import Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.db.models import Site
from app.db.transaction import transaction
from app.service.base import BaseService
from app.utils.spider import get_spider_by_name


def get_site_service(db: Session = Depends(get_db)):
    return SiteService(db=db)


class SiteService(BaseService):

    def get_sites(self):
        sites = self.db.query(Site).filter(Site.status.is_not(None)).order_by(Site.priority).all()
        return [self.get_site(site) for site in sites]

    def get_site(self, db_site: Site):
        spider = get_spider_by_name(db_site.class_str)

        return schema.Site(
            name=spider.name,
            id=db_site.id,
            priority=db_site.priority,
            host=db_site.alternate_host or spider.host,
            alternate_host=db_site.alternate_host,
            status=db_site.status,
        )

    @transaction
    def modify_site(self, site: schema.SiteUpdate):
        db_site = Site.get(self.db, site.id)
        db_site.update(self.db, site.model_dump())
