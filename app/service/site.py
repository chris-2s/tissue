from fastapi import Depends
from sqlalchemy.orm import Session

from app.db import get_db, SessionFactory
from app.db.models import Site
from app.db.transaction import transaction
from app.exception import BizException
from app.exception.codes import ErrorCode
from app.i18n import translate
from app.integrations.notifications.manager import notification_manager
from app.schema.notification import CookieInvalidPayload
from app.schema.site import LoginSubmit, Site as SiteSchema, SiteUpdate
from app.service.base import BaseService
from app.service.cookiecloud import CookieCloudService
from app.service.spider import SpiderService
from app.utils.cookies import cookiecloud_items_to_cookies, parse_cookie_header, to_cookie_header
from app.utils.logger import logger


def get_site_service(db: Session = Depends(get_db)):
    return SiteService(db=db)


class SiteService(BaseService):

    def get_sites(self):
        sites = self.db.query(Site).filter(Site.status.is_not(None)).order_by(Site.priority).all()
        return [self.get_site(site) for site in sites]

    def get_site(self, db_site: Site):
        spider_key = SpiderService.normalize_spider_key(db_site.spider_key)
        if not spider_key:
            raise BizException(
                "站点类型不存在",
                error_code=ErrorCode.SITE_TYPE_NOT_FOUND,
                error_params={'spider_key': db_site.spider_key},
            )

        spider_class = SpiderService.get_spider_class(db_site.spider_key)
        spider_name = spider_class.name if spider_class else db_site.spider_key
        capabilities = SpiderService.get_spider_capabilities(spider_key)

        return SiteSchema(
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
    def modify_site(self, site: SiteUpdate):
        db_site = Site.get(self.db, site.id)

        payload = site.model_dump()
        if payload.get('cookies') is not None:
            normalized = to_cookie_header(parse_cookie_header(payload['cookies']))
            payload['cookies'] = normalized or None

        db_site.update(self.db, payload)

    def testing_site(self):
        sites = self.db.query(Site).filter(Site.status == None).order_by(Site.priority).all()
        for site in sites:
            spider = SpiderService.build_spider(site, include_cookies=False)
            if not spider:
                logger.warning(translate('log.site.unregistered_skip_test', {'site_key': site.spider_key}))
                continue
            try:
                name = spider.name[0] + '*' * (len(spider.name) - 2) + spider.name[-1]
                logger.info(translate('log.site.connectivity_testing', {'site_name': name}))
                if spider.testing():
                    site.update(self.db, {'status': 1})
                    self.db.commit()
                    logger.info(translate('log.site.enabled_success', {'site_name': spider.name}))
                else:
                    logger.warning(translate('log.site.unreachable', {'site_name': name}))
            finally:
                spider.close()

        self._check_cookies()

    def _check_cookies(self):
        from urllib.parse import urlparse

        sites = self.db.query(Site).filter(Site.cookies.isnot(None)).all()
        for site in sites:
            spider_instance = SpiderService.build_spider(site, include_cookies=False)
            if not spider_instance:
                logger.warning(translate('log.site.unregistered_skip_cookie_check', {'site_key': site.spider_key}))
                continue
            try:
                stale_cookie_header = site.cookies
                if not spider_instance.check_cookie_validity(stale_cookie_header):
                    current_site = self.db.query(Site).get(site.id)
                    if not current_site or current_site.cookies != stale_cookie_header:
                        logger.info(translate('log.site.cookie_updated_skip_cleanup', {'site_name': spider_instance.name}))
                        continue

                    domain = urlparse(site.alternate_host or spider_instance.origin_host).netloc
                    cookie_notify = CookieInvalidPayload(
                        site_name=spider_instance.name,
                        domain=domain,
                        message=translate('message.cookie.invalid.reason'),
                    )
                    notification_manager.emit_cookie_invalid(cookie_notify)

                    current_site.cookies = None
                    self.db.commit()
                    logger.warning(translate('log.site.cookie_invalid_cleared', {'site_name': spider_instance.name}))
            finally:
                spider_instance.close()

    def get_login_page(self, site_id: int) -> dict:
        site = self.db.query(Site).get(site_id)
        if not site:
            raise BizException("站点不存在", error_code=ErrorCode.SITE_NOT_FOUND)

        spider_service = SpiderService(self.db)
        spider = spider_service.build_spider(site, include_cookies=False)
        if not spider:
            raise BizException("站点类型不存在", error_code=ErrorCode.SITE_TYPE_NOT_FOUND)
        if not spider.supports_login:
            spider.close()
            raise BizException("当前站点不支持登录", error_code=ErrorCode.SITE_LOGIN_UNSUPPORTED)

        try:
            return spider.get_login_page()
        except NotImplementedError:
            raise BizException("当前站点不支持登录", error_code=ErrorCode.SITE_LOGIN_UNSUPPORTED)
        except Exception:
            raise BizException(
                "获取登录页失败",
                error_code=ErrorCode.SITE_LOGIN_PAGE_FAILED,
                error_params={'site_name': spider.name},
            )
        finally:
            spider.close()

    def submit_login(self, site_id: int, data: LoginSubmit):
        from urllib.parse import urlparse

        site = self.db.query(Site).get(site_id)
        if not site:
            raise BizException("站点不存在", error_code=ErrorCode.SITE_NOT_FOUND)

        spider_service = SpiderService(self.db)
        spider = spider_service.build_spider(site, include_cookies=False)
        if not spider:
            raise BizException("站点类型不存在", error_code=ErrorCode.SITE_TYPE_NOT_FOUND)
        if not spider.supports_login:
            spider.close()
            raise BizException("当前站点不支持登录", error_code=ErrorCode.SITE_LOGIN_UNSUPPORTED)

        try:
            cookie_list = spider.submit_login(
                data.cookies,
                data.authenticity_token,
                data.username,
                data.password,
                data.captcha
            )
        except NotImplementedError:
            raise BizException("当前站点不支持登录", error_code=ErrorCode.SITE_LOGIN_UNSUPPORTED)
        except Exception:
            raise BizException(
                "登录失败",
                error_code=ErrorCode.SITE_LOGIN_FAILED,
                error_params={'site_name': spider.name},
            )

        cookie_str = to_cookie_header(cookiecloud_items_to_cookies(cookie_list))
        site.cookies = cookie_str
        self.db.commit()

        try:
            domain = urlparse(site.alternate_host or spider.origin_host).netloc
            CookieCloudService().push_cookie(cookie_list, domain)
        except Exception:
            pass
        finally:
            spider.close()

    @classmethod
    def job_testing_sites(cls):
        with SessionFactory() as db:
            SiteService(db).testing_site()
