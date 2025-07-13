from app import schema

from fastapi import Depends
from sqlalchemy.orm import Session

from app.db import get_db, SessionFactory
from app.db.models import Site
from app.db.transaction import transaction
from app.service.base import BaseService
from app.service.spider import SpiderService
from app.utils.logger import logger


def get_site_service(db: Session = Depends(get_db)):
    return SiteService(db=db)


class SiteService(BaseService):

    def get_sites(self):
        sites = self.db.query(Site).filter(Site.status.is_not(None)).order_by(Site.priority).all()
        return [self.get_site(site) for site in sites]

    def get_site(self, db_site: Site):
        spider = SpiderService.get_spider_by_name(db_site.class_str)

        return schema.Site(
            id=db_site.id,
            priority=db_site.priority,
            alternate_host=db_site.alternate_host,
            status=db_site.status,
            name=spider.name,
            downloadable=spider.downloadable,
        )

    @transaction
    def modify_site(self, site: schema.SiteUpdate):
        db_site = Site.get(self.db, site.id)
        db_site.update(self.db, site.model_dump())

    def testing_site(self):
        sites = self.db.query(Site).filter(Site.status == None).order_by(Site.priority).all()
        for site in sites:
            spider = SpiderService.get_spider_by_name(site.class_str)
            name = spider.name[0] + '*' * (len(spider.name) - 2) + spider.name[-1]
            logger.info(f"站点【{name}】连接性测试...")
            if spider().testing():
                site.update(self.db, {'status': 1})
                self.db.commit()
                logger.info(f"站点【{spider.name}】启用成功")
            else:
                logger.error(f"站点【{name}】无法连接，请检查网络连接")

    @classmethod
    def job_testing_sites(cls):
        with SessionFactory() as db:
            SiteService(db).testing_site()
