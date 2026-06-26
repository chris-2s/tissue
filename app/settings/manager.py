import json
from configparser import ConfigParser
from typing import Any

from sqlalchemy.exc import OperationalError

from app.db import SessionFactory
from app.db.models import SettingEntry
from app.schema.setting import (
    SettingCookieCloud,
    SettingCrawler,
    SettingDownload,
    SettingFile,
    SettingLibrary,
    SettingNotify,
    config_path,
)
from app.settings.migrations import NAMESPACE_ORDER, get_upgrade, latest_version
from app.utils.logger import logger


class SettingsManager:
    namespace_models = {
        'library': SettingLibrary,
        'file': SettingFile,
        'download': SettingDownload,
        'crawler': SettingCrawler,
        'notify': SettingNotify,
        'cookiecloud': SettingCookieCloud,
    }

    def bootstrap(self):
        imported_from_ini = False
        with SessionFactory() as db:
            try:
                entries = db.query(SettingEntry).all()
            except OperationalError:
                logger.warning('settings 表尚未准备完成，跳过配置 bootstrap')
                return

            if not entries:
                imported_from_ini = self._seed_settings(db)
                entries = db.query(SettingEntry).all()

            existing_namespaces = {entry.namespace for entry in entries}
            for namespace in NAMESPACE_ORDER:
                if namespace in existing_namespaces:
                    continue
                self._upsert_namespace(
                    db=db,
                    namespace=namespace,
                    payload=self._default_payload(namespace),
                    version=latest_version(namespace),
                )

            for entry in db.query(SettingEntry).all():
                self._migrate_entry(db, entry)

            db.commit()

        if imported_from_ini and config_path.exists():
            config_path.unlink()
            logger.info('旧配置文件迁移成功，已删除 config/app.conf')

    def load(self) -> dict[str, Any]:
        payloads = {namespace: self._default_payload(namespace) for namespace in NAMESPACE_ORDER}
        with SessionFactory() as db:
            try:
                entries = db.query(SettingEntry).all()
            except OperationalError:
                return payloads

            for entry in entries:
                if entry.namespace not in self.namespace_models:
                    continue
                payloads[entry.namespace] = self._normalize_namespace_payload(entry.namespace, self._decode_payload(entry.payload))
        return payloads

    def save_section(self, section: str, payload: dict[str, Any]):
        with SessionFactory() as db:
            namespace = section
            if namespace not in self.namespace_models:
                raise ValueError(f'不支持的配置分组: {section}')
            normalized = self._normalize_namespace_payload(namespace, payload)
            self._upsert_namespace(db, namespace, normalized, latest_version(namespace))
            db.commit()

    def _seed_settings(self, db) -> bool:
        payloads = self._build_seed_payloads()
        for namespace, payload in payloads.items():
            self._upsert_namespace(db, namespace, payload, 1)
        return config_path.exists()

    def _build_seed_payloads(self) -> dict[str, dict[str, Any]]:
        if not config_path.exists():
            return {namespace: self._default_payload(namespace) for namespace in NAMESPACE_ORDER}

        parser = ConfigParser()
        parser.read(config_path)
        legacy_sections = {section: dict(parser.items(section)) for section in parser.sections()}
        return self._import_legacy_sections(legacy_sections)

    def _import_legacy_sections(self, legacy_sections: dict[str, dict[str, Any]]) -> dict[str, dict[str, Any]]:
        app_payload = {
            'timeout': SettingCrawler(**{'timeout': legacy_sections.get('app', {}).get('timeout', 60)}).timeout,
            **SettingLibrary(**legacy_sections.get('app', {})).model_dump(),
        }
        file_payload = SettingFile(**legacy_sections.get('file', {}))
        download_payload = SettingDownload(**legacy_sections.get('download', {}))
        notify_payload = SettingNotify(**legacy_sections.get('notify', {}))
        cookiecloud_payload = SettingCookieCloud(**legacy_sections.get('cookiecloud', {}))

        return {
            'library': SettingLibrary(
                video_path=app_payload['video_path'],
                video_size_minimum=app_payload['video_size_minimum'],
                video_format=app_payload['video_format'],
            ).model_dump(),
            'file': file_payload.model_dump(),
            'download': download_payload.model_dump(),
            'crawler': SettingCrawler(timeout=app_payload['timeout']).model_dump(),
            'notify': notify_payload.model_dump(),
            'cookiecloud': cookiecloud_payload.model_dump(),
        }

    def _migrate_entry(self, db, entry: SettingEntry):
        if entry.namespace not in self.namespace_models:
            return

        payload = self._decode_payload(entry.payload)
        version = entry.version
        target_version = latest_version(entry.namespace)

        while version < target_version:
            upgrade = get_upgrade(entry.namespace, version)
            if upgrade is None:
                raise RuntimeError(f'缺少配置迁移脚本: {entry.namespace} v{version} -> v{version + 1}')
            payload = upgrade(payload)
            version += 1

        normalized = self._normalize_namespace_payload(entry.namespace, payload)
        entry.payload = self._encode_payload(normalized)
        entry.version = target_version
        db.add(entry)

    def _normalize_namespace_payload(self, namespace: str, payload: dict[str, Any]) -> dict[str, Any]:
        model = self.namespace_models[namespace]
        return model(**payload).model_dump()

    def _default_payload(self, namespace: str) -> dict[str, Any]:
        model = self.namespace_models[namespace]
        return model().model_dump()

    @staticmethod
    def _decode_payload(payload: str) -> dict[str, Any]:
        data = json.loads(payload)
        return data if isinstance(data, dict) else {}

    @staticmethod
    def _encode_payload(payload: dict[str, Any]) -> str:
        return json.dumps(payload, ensure_ascii=False, separators=(',', ':'))

    def _upsert_namespace(self, db, namespace: str, payload: dict[str, Any], version: int):
        entry = db.query(SettingEntry).filter(SettingEntry.namespace == namespace).one_or_none()
        encoded = self._encode_payload(payload)
        if entry is None:
            entry = SettingEntry(namespace=namespace, version=version, payload=encoded)
            db.add(entry)
        else:
            entry.payload = encoded
            entry.version = version
            db.add(entry)


settings_manager = SettingsManager()
