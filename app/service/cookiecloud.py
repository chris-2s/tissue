from PyCookieCloud import PyCookieCloud

from app.db import get_db
from app.db.models import Site
from app.schema import Setting
from app.service.spider import SpiderService
from app.utils.logger import logger


class CookieCloudService:
    def sync(self):
        setting = Setting().cookiecloud
        if not setting.enabled:
            logger.info("CookieCloud 未启用")
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
                    cookie_str = self._format_cookie_string(matched_cookies)
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
            logger.info("CookieCloud 未启用")
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

            decrypted_data[domain] = cookies

            if not cookie_cloud.update_cookie(decrypted_data):
                logger.error("CookieCloud 推送失败")
                return

            logger.info(f"站点 {domain} cookie 推送成功")

        except Exception as e:
            logger.error(f"CookieCloud 推送失败: {e}")

    def delete_cookie(self, domain: str):
        setting = Setting().cookiecloud
        if not setting.enabled:
            logger.info("CookieCloud 未启用")
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

            if domain in decrypted_data:
                del decrypted_data[domain]
                if cookie_cloud.update_cookie(decrypted_data):
                    logger.info(f"站点 {domain} cookie 已从 CookieCloud 删除")
                else:
                    logger.error("CookieCloud 删除失败")
            else:
                logger.info(f"CookieCloud 上未找到域名 {domain} 的 cookie")

        except Exception as e:
            logger.error(f"CookieCloud 删除失败: {e}")

    def _find_matching_cookies(self, origin_host: str, cookie_dict: dict) -> list | None:
        from urllib.parse import urlparse
        parsed = urlparse(origin_host)
        host_domain = parsed.netloc or parsed.path
        if host_domain.startswith('www.'):
            host_domain = host_domain[4:]
        for domain, cookies in cookie_dict.items():
            domain_clean = domain.lstrip('.')
            if host_domain.endswith(domain_clean) or domain_clean.endswith(host_domain):
                return cookies
        return None

    def _format_cookie_string(self, cookies: list) -> str:
        """将 cookie 数组转换为浏览器复制的字符串格式"""
        parts = []
        for cookie in cookies:
            name = cookie.get('name', '')
            value = cookie.get('value', '')
            if name:
                parts.append(f"{name}={value}")
        return '; '.join(parts)
