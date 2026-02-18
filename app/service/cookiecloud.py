import base64
import hashlib
import importlib
import json
from Crypto.Cipher import AES
from Crypto.Util.Padding import unpad

from app.db import get_db
from app.db.models import Site
from app.schema import Setting
from app.utils.logger import logger


def md5_key(uuid: str, password: str) -> str:
    return hashlib.md5(f"{uuid}-{password}".encode()).hexdigest()[:16]


def decrypt_aes(encrypted: str, key: str) -> str:
    data = base64.b64decode(encrypted)
    salt = data[8:16]
    ciphertext = data[16:]

    key_iv = _evp_bytes_to_key(key, salt)
    aes_key = key_iv[:32]
    aes_iv = key_iv[32:]

    cipher = AES.new(aes_key, AES.MODE_CBC, aes_iv)
    decrypted = unpad(cipher.decrypt(ciphertext), AES.block_size)
    return decrypted.decode('utf-8')


def _evp_bytes_to_key(password: str, salt: bytes, key_len=32, iv_len=16):
    d = b''
    d_i = b''
    while len(d) < key_len + iv_len:
        d_i = hashlib.md5(d_i + password.encode() + salt).digest()
        d += d_i
    return d[:key_len + iv_len]


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
            resp = requests.get(f"{setting.host}/get/{setting.uuid}")
            resp.raise_for_status()
            data = resp.json()
            encrypted = data.get('encrypted')
            if not encrypted:
                logger.warning("CookieCloud 返回数据为空")
                return

            decrypted = decrypt_aes(encrypted, md5_key(setting.uuid, setting.password))
            cookie_data = json.loads(decrypted)
            cookie_dict = cookie_data.get('cookie_data', {})

            db = next(get_db())
            sites = db.query(Site).all()

            matched_count = 0
            for site in sites:
                spider_class = self._get_spider_class(site.class_str)
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
                    logger.info(f"站点 {site.class_str} 同步 cookie 成功")

            logger.info(f"CookieCloud 同步完成，共匹配 {matched_count} 个站点")

        except Exception as e:
            logger.error(f"CookieCloud 同步失败: {e}")

    def _get_spider_class(self, class_str: str):
        try:
            module = importlib.import_module('app.utils.spider')
            return getattr(module, class_str)
        except (ImportError, AttributeError):
            return None

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


import requests
