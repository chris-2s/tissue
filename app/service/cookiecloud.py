from PyCookieCloud import PyCookieCloud

from app.db import get_db
from app.db.models import Site
from app.schema import Setting
from app.service.spider import SpiderService
from app.utils.cookies import (
    cookiecloud_items_to_cookies,
    cookies_to_cookiecloud_items,
    is_same_domain_or_subdomain,
    normalize_host,
    parse_cookie_header,
    to_cookie_header,
)
from app.utils.logger import logger


class CookieCloudService:
    def sync(self):
        setting = Setting().cookiecloud
        if not setting.enabled:
            logger.debug("CookieCloud 未启用，跳过同步")
            return

        if not setting.host or not setting.uuid or not setting.password:
            logger.warning("CookieCloud 配置不完整")
            return

        try:
            cookie_cloud = PyCookieCloud(setting.host, setting.uuid, setting.password)
            decrypted_data = cookie_cloud.get_decrypted_data()
            if not decrypted_data:
                logger.warning("CookieCloud 返回数据为空")
                return

            cookie_dict = decrypted_data

            db = next(get_db())
            sites = db.query(Site).all()

            matched_count = 0
            for site in sites:
                spider_class = SpiderService.get_spider_class(site.spider_key)
                if not spider_class:
                    continue

                origin_host = site.alternate_host or spider_class.origin_host
                if not origin_host:
                    continue

                matched_cookies = self._find_matching_cookies(origin_host, cookie_dict)
                if matched_cookies:
                    cookie_str = to_cookie_header(cookiecloud_items_to_cookies(matched_cookies))
                    site.cookies = cookie_str
                    db.commit()
                    matched_count += 1
                    logger.info(f"站点 {site.spider_key} 同步 cookie 成功")

            logger.info(f"CookieCloud 同步完成，共匹配 {matched_count} 个站点")

        except Exception as e:
            logger.error(f"CookieCloud 同步失败: {e}")

    def push_cookie(self, cookies: list, domain: str):
        setting = Setting().cookiecloud
        if not setting.enabled:
            logger.debug("CookieCloud 未启用，跳过推送")
            return

        if not setting.host or not setting.uuid or not setting.password:
            logger.warning("CookieCloud 配置不完整")
            return

        try:
            cookie_cloud = PyCookieCloud(setting.host, setting.uuid, setting.password)
            decrypted_data = cookie_cloud.get_decrypted_data()
            if not decrypted_data:
                logger.warning("CookieCloud 返回数据为空，无法推送")
                return

            normalized_items = cookies_to_cookiecloud_items(cookiecloud_items_to_cookies(cookies))
            decrypted_data[domain] = normalized_items

            if not cookie_cloud.update_cookie(decrypted_data):
                logger.warning("CookieCloud 推送失败")
                return

            logger.info(f"站点 {domain} cookie 推送成功")

        except Exception as e:
            logger.error(f"CookieCloud 推送失败: {e}")

    def delete_cookie_if_match(self, domain: str, expected_cookie_header: str | None):
        setting = Setting().cookiecloud
        if not setting.enabled:
            logger.debug("CookieCloud 未启用，跳过删除")
            return

        if not setting.host or not setting.uuid or not setting.password:
            logger.warning("CookieCloud 配置不完整")
            return

        try:
            cookie_cloud = PyCookieCloud(setting.host, setting.uuid, setting.password)
            decrypted_data = cookie_cloud.get_decrypted_data()
            if not decrypted_data:
                logger.warning("CookieCloud 返回数据为空")
                return

            cloud_items = decrypted_data.get(domain)
            if not cloud_items:
                logger.debug(f"CookieCloud 上未找到域名 {domain} 的 cookie")
                return

            cloud_cookie_header = to_cookie_header(cookiecloud_items_to_cookies(cloud_items))
            expected_normalized = to_cookie_header(parse_cookie_header(expected_cookie_header))

            if cloud_cookie_header != expected_normalized:
                logger.warning(f"域名 {domain} 的 CookieCloud cookie 已更新，跳过删除")
                return

            del decrypted_data[domain]
            if cookie_cloud.update_cookie(decrypted_data):
                logger.info(f"站点 {domain} cookie 已从 CookieCloud 删除")
            else:
                logger.warning("CookieCloud 删除失败")

        except Exception as e:
            logger.error(f"CookieCloud 条件删除失败: {e}")

    def _find_matching_cookies(self, origin_host: str, cookie_dict: dict) -> list | None:
        host_domain = normalize_host(origin_host)
        if not host_domain:
            return None

        matched: list[dict] = []
        seen: set[tuple[str, str, str, str]] = set()
        for domain, cookies in cookie_dict.items():
            if not is_same_domain_or_subdomain(host_domain, domain):
                continue

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

        return matched or None
