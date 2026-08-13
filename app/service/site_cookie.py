from urllib.parse import urlparse

from PyCookieCloud import PyCookieCloud

from app.db import SessionFactory
from app.db.models import Site
from app.i18n import translate
from app.integrations.notifications.manager import notification_manager
from app.schema import Setting
from app.schema.notification import CookieInvalidPayload
from app.service.spider import SpiderService
from app.utils.cookies import (
    cookiecloud_items_to_cookies,
    cookies_to_cookiecloud_items,
    is_same_domain_or_subdomain,
    normalize_host,
    to_cookie_header,
)
from app.utils.logger import logger


class SiteCookieService:
    def maintain(self):
        decrypted_data = self._load_remote_cookies()
        matched_count = 0

        with SessionFactory() as db:
            sites = db.query(Site).all()
            db.expunge_all()

        for site in sites:
            spider = None
            try:
                spider = SpiderService.build_spider(site, include_cookies=False)
                if not spider:
                    if site.cookies:
                        logger.warning(translate(
                            'log.site.unregistered_skip_cookie_check',
                            {'site_key': site.spider_key},
                        ))
                    continue

                origin_host = site.alternate_host or spider.origin_host
                if not origin_host:
                    continue

                matched_entries = (
                    self._find_matching_cookie_entries(origin_host, decrypted_data)
                    if decrypted_data is not None
                    else []
                )
                if matched_entries:
                    matched_cookies = self._merge_cookie_entries(matched_entries)
                    remote_cookie = to_cookie_header(cookiecloud_items_to_cookies(matched_cookies)) or None
                    if remote_cookie:
                        status, validated_cookies, user_agent = spider.check_cookie_validity(remote_cookie)

                        if status == 'valid':
                            validated_cookie = (
                                to_cookie_header(cookiecloud_items_to_cookies(validated_cookies)) or None
                            )
                            self._store_cookie(site.id, validated_cookie, user_agent or None)
                            matched_count += 1
                            logger.info(translate(
                                'log.cookiecloud.site_sync_success',
                                {'site_key': site.spider_key},
                            ))
                            continue
                        if status == 'invalid':
                            for domain, _ in matched_entries:
                                self.delete_remote_cookie(domain)
                            logger.warning(translate(
                                'log.cookiecloud.invalid_cookie_deleted_remote',
                                {'site_key': site.spider_key},
                            ))

                if not site.cookies:
                    continue

                status, _, _ = spider.check_cookie_validity(site.cookies)
                if status == 'invalid':
                    self._clear_invalid_cookie(site, spider.name, origin_host)
                elif status == 'unknown':
                    logger.info(translate(
                        'log.site.cookie_check_deferred',
                        {'site_name': spider.name},
                    ))
            except Exception as e:
                logger.error(translate(
                    'log.site.cookie_check_failed',
                    {'site_key': site.spider_key, 'error': str(e)},
                ))
            finally:
                if spider:
                    try:
                        spider.close()
                    except Exception:
                        logger.debug(translate(
                            'log.spider.session_close_failed',
                            {'site_name': spider.name},
                        ))

        logger.info(translate('log.cookiecloud.sync_completed', {'count': matched_count}))

    def _load_remote_cookies(self) -> dict | None:
        setting = Setting().cookiecloud
        if not setting.enabled:
            logger.debug(translate('log.cookiecloud.sync_disabled'))
            return None

        if not setting.host or not setting.uuid or not setting.password:
            logger.warning(translate('log.cookiecloud.config_incomplete'))
            return None

        try:
            cookie_cloud = PyCookieCloud(setting.host, setting.uuid, setting.password)
            decrypted_data = cookie_cloud.get_decrypted_data()
            if not decrypted_data:
                logger.warning(translate('log.cookiecloud.empty_data'))
                return {}
            return decrypted_data
        except Exception as e:
            logger.error(translate('log.cookiecloud.sync_failed', {'error': str(e)}))
            return None

    def _store_cookie(
        self,
        site_id: int,
        cookie: str | None,
        user_agent: str | None,
    ) -> None:
        with SessionFactory() as db:
            db.query(Site).filter(Site.id == site_id).update(
                {'cookies': cookie, 'user_agent': user_agent}, synchronize_session=False,
            )
            db.commit()

    def _clear_invalid_cookie(
        self,
        site: Site,
        site_name: str,
        origin_host: str,
    ) -> None:
        with SessionFactory() as db:
            updated = db.query(Site).filter(
                Site.id == site.id,
                Site.cookies == site.cookies,
            ).update(
                {'cookies': None},
                synchronize_session=False,
            )
            db.commit()
        if not updated:
            logger.info(translate('log.site.cookie_updated_skip_cleanup', {'site_name': site_name}))
            return

        notification_manager.emit_cookie_invalid(CookieInvalidPayload(
            site_name=site_name,
            domain=urlparse(origin_host).netloc,
            message=translate('message.cookie.invalid.reason'),
        ))
        logger.warning(translate('log.site.cookie_invalid_cleared', {'site_name': site_name}))

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
