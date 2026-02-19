from app import schema
from app.schema import CookieNotify

from fastapi import Depends
from sqlalchemy.orm import Session

from app.db import get_db, SessionFactory
from app.db.models import Site
from app.db.transaction import transaction
from app.service.base import BaseService
from app.service.spider import SpiderService
from app.service.cookiecloud import CookieCloudService
from app.exception import BizException
from app.utils.logger import logger
from app.utils import notify


def get_site_service(db: Session = Depends(get_db)):
    return SiteService(db=db)


class SiteService(BaseService):

    def get_sites(self):
        sites = self.db.query(Site).filter(Site.status.is_not(None)).order_by(Site.priority).all()
        return [self.get_site(site) for site in sites]

    def get_site(self, db_site: Site):
        spider_key = SpiderService.normalize_spider_key(db_site.spider_key)
        if not spider_key:
            raise BizException(f"站点 spider_key 无效: {db_site.spider_key}")

        spider_class = SpiderService.get_spider_class(db_site.spider_key)
        spider_name = spider_class.name if spider_class else db_site.spider_key
        capabilities = SpiderService.get_spider_capabilities(spider_key)

        return schema.Site(
            id=db_site.id,
            spider_key=spider_key,
            priority=db_site.priority,
            alternate_host=db_site.alternate_host,
            status=db_site.status,
            cookies=db_site.cookies,
            name=spider_name,
            capabilities=capabilities,
        )

    @transaction
    def modify_site(self, site: schema.SiteUpdate):
        db_site = Site.get(self.db, site.id)
        db_site.update(self.db, site.model_dump())

    def testing_site(self):
        sites = self.db.query(Site).filter(Site.status == None).order_by(Site.priority).all()
        for site in sites:
            spider = SpiderService.build_spider(site, include_cookies=False)
            if not spider:
                logger.error(f"站点【{site.spider_key}】未注册，跳过测试")
                continue
            name = spider.name[0] + '*' * (len(spider.name) - 2) + spider.name[-1]
            logger.info(f"站点【{name}】连接性测试...")
            if spider.testing():
                site.update(self.db, {'status': 1})
                self.db.commit()
                logger.info(f"站点【{spider.name}】启用成功")
            else:
                logger.error(f"站点【{name}】无法连接，请检查网络连接")

        self._check_cookies()

    def _check_cookies(self):
        from urllib.parse import urlparse

        sites = self.db.query(Site).filter(Site.cookies.isnot(None)).all()
        for site in sites:
            spider_instance = SpiderService.build_spider(site)
            if not spider_instance:
                logger.error(f"站点【{site.spider_key}】未注册，跳过 Cookie 检查")
                continue

            if not spider_instance.session.cookies:
                domain = urlparse(site.alternate_host or spider_instance.origin_host).netloc
                cookie_notify = CookieNotify(
                    site_name=spider_instance.name,
                    domain=domain,
                    message="Cookie已失效，请重新登录"
                )
                notify.send_cookie(cookie_notify)

                CookieCloudService().delete_cookie(domain)

                site.cookies = None
                self.db.commit()
                logger.warning(f"站点【{spider_instance.name}】Cookie已失效并清除")

    def get_login_page(self, site_id: int) -> dict:
        site = self.db.query(Site).get(site_id)
        if not site:
            raise BizException("站点不存在")

        spider_service = SpiderService(self.db)
        spider = spider_service.build_spider(site, include_cookies=False)
        if not spider:
            raise BizException("站点类型不存在")
        if not spider.supports_login:
            raise BizException("该站点暂不支持登录")

        try:
            return spider.get_login_page()
        except NotImplementedError:
            raise BizException("该站点暂不支持登录")
        except Exception as e:
            raise BizException(f"获取登录页失败: {str(e)}")

    def submit_login(self, site_id: int, data: schema.LoginSubmit):
        from urllib.parse import urlparse

        site = self.db.query(Site).get(site_id)
        if not site:
            raise BizException("站点不存在")

        spider_service = SpiderService(self.db)
        spider = spider_service.build_spider(site, include_cookies=False)
        if not spider:
            raise BizException("站点类型不存在")
        if not spider.supports_login:
            raise BizException("该站点暂不支持登录")

        try:
            cookie_list = spider.submit_login(
                data.cookies,
                data.authenticity_token,
                data.username,
                data.password,
                data.captcha
            )
        except NotImplementedError:
            raise BizException("该站点暂不支持登录")
        except Exception as e:
            raise BizException(f"登录失败: {str(e)}")

        cookie_str = CookieCloudService()._format_cookie_string(cookie_list)
        site.cookies = cookie_str
        self.db.commit()

        try:
            domain = urlparse(site.alternate_host or spider.origin_host).netloc
            CookieCloudService().push_cookie(cookie_list, domain)
        except Exception:
            pass

    @classmethod
    def job_testing_sites(cls):
        with SessionFactory() as db:
            SiteService(db).testing_site()
