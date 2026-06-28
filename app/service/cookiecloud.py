from PyCookieCloud import PyCookieCloud

from app.i18n import translate
from app.db import get_db
from app.db.models import Site
from app.schema import Setting
from app.service.spider import SpiderService
from app.utils.cookies import (
    cookiecloud_items_to_cookies,
    cookies_to_cookiecloud_items,
    is_same_domain_or_subdomain,
    normalize_host,
    to_cookie_header,
)
from app.utils.logger import logger


class CookieCloudService:
    def sync(self):
        setting = Setting().cookiecloud
        if not setting.enabled:
            logger.debug(translate('log.cookiecloud.sync_disabled'))
            return

        if not setting.host or not setting.uuid or not setting.password:
            logger.warning(translate('log.cookiecloud.config_incomplete'))
            return

        try:
            cookie_cloud = PyCookieCloud(setting.host, setting.uuid, setting.password)
            decrypted_data = cookie_cloud.get_decrypted_data()
            if not decrypted_data:
                logger.warning(translate('log.cookiecloud.empty_data'))
                return

            db = next(get_db())
            sites = db.query(Site).all()

            matched_count = 0
            for site in sites:
                spider = SpiderService.build_spider(site, include_cookies=False)
                if not spider:
                    continue

                origin_host = site.alternate_host or spider.origin_host
                if not origin_host:
                    spider.close()
                    continue

                try:
                    matched_entries = self._find_matching_cookie_entries(origin_host, decrypted_data)
                    if not matched_entries:
                        continue

                    matched_cookies = self._merge_cookie_entries(matched_entries)
                    cookie_str = to_cookie_header(cookiecloud_items_to_cookies(matched_cookies))
                    if spider.check_cookie_validity(cookie_str):
                        site.cookies = cookie_str
                        db.commit()
                        matched_count += 1
                        logger.info(translate('log.cookiecloud.site_sync_success', {'site_key': site.spider_key}))
                        continue

                    for domain, _ in matched_entries:
                        self.delete_remote_cookie(domain)
                    logger.warning(translate('log.cookiecloud.invalid_cookie_deleted_remote', {'site_key': site.spider_key}))
                finally:
                    spider.close()

            logger.info(translate('log.cookiecloud.sync_completed', {'count': matched_count}))

        except Exception as e:
            logger.error(translate('log.cookiecloud.sync_failed', {'error': str(e)}))

    def push_cookie(self, cookies: list, domain: str):
        setting = Setting().cookiecloud
        if not setting.enabled:
            logger.debug(translate('log.cookiecloud.push_disabled'))
            return

        if not setting.host or not setting.uuid or not setting.password:
            logger.warning(translate('log.cookiecloud.config_incomplete'))
            return

        try:
            cookie_cloud = PyCookieCloud(setting.host, setting.uuid, setting.password)
            decrypted_data = cookie_cloud.get_decrypted_data()
            if decrypted_data is None:
                decrypted_data = {}

            normalized_items = cookies_to_cookiecloud_items(cookiecloud_items_to_cookies(cookies))
            decrypted_data[domain] = normalized_items

            if not cookie_cloud.update_cookie(decrypted_data):
                logger.warning(translate('log.cookiecloud.push_failed'))
                return

            logger.info(translate('log.cookiecloud.push_success', {'domain': domain}))

        except Exception as e:
            logger.error(translate('log.cookiecloud.push_failed_with_error', {'error': str(e)}))

    def delete_remote_cookie(self, domain: str):
        setting = Setting().cookiecloud
        if not setting.enabled:
            logger.debug(translate('log.cookiecloud.delete_disabled'))
            return

        if not setting.host or not setting.uuid or not setting.password:
            logger.warning(translate('log.cookiecloud.config_incomplete'))
            return

        try:
            cookie_cloud = PyCookieCloud(setting.host, setting.uuid, setting.password)
            decrypted_data = cookie_cloud.get_decrypted_data()
            if not decrypted_data:
                logger.warning(translate('log.cookiecloud.empty_data'))
                return

            if domain not in decrypted_data:
                logger.debug(translate('log.cookiecloud.domain_not_found', {'domain': domain}))
                return

            del decrypted_data[domain]
            if cookie_cloud.update_cookie(decrypted_data):
                logger.info(translate('log.cookiecloud.remote_deleted', {'domain': domain}))
            else:
                logger.warning(translate('log.cookiecloud.delete_failed'))

        except Exception as e:
            logger.error(translate('log.cookiecloud.delete_failed_with_error', {'error': str(e)}))

    def _find_matching_cookie_entries(self, origin_host: str, cookie_dict: dict) -> list[tuple[str, list[dict]]]:
        host_domain = normalize_host(origin_host)
        if not host_domain:
            return []

        return [
            (domain, cookies)
            for domain, cookies in cookie_dict.items()
            if is_same_domain_or_subdomain(host_domain, domain)
        ]

    def _merge_cookie_entries(self, matched_entries: list[tuple[str, list[dict]]]) -> list[dict]:
        matched: list[dict] = []
        seen: set[tuple[str, str, str, str]] = set()
        for domain, cookies in matched_entries:
            for item in cookies:
                key = (
                    str(item.get('name', '')),
                    str(item.get('value', '')),
                    str(item.get('domain', '') or domain),
                    str(item.get('path', '') or '/'),
                )
                if key in seen:
                    continue
                seen.add(key)
                matched.append(item)

        return matched
