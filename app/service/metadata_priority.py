from fastapi import Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.db.models import MetadataPriority, Site
from app.schema.site import (
    MetadataPriorityFieldConfig,
    MetadataPriorityFieldKey,
    MetadataPriorityFieldsConfig,
    MetadataPrioritySettings,
    MetadataPriorityUpdate,
    SpiderKey,
)
from app.service.base import BaseService


def get_metadata_priority_service(db: Session = Depends(get_db)):
    return MetadataPriorityService(db=db)


class MetadataPriorityService(BaseService):
    supported_fields = (
        MetadataPriorityFieldKey.COVER,
        MetadataPriorityFieldKey.RATING,
        MetadataPriorityFieldKey.ACTORS,
    )

    def get_settings(self) -> MetadataPrioritySettings:
        global_sites = self.get_global_site_order()

        fields = {}
        for field in self.supported_fields:
            effective_sites = self.get_effective_site_order(field, global_sites)
            fields[field.value] = MetadataPriorityFieldConfig(
                sites=effective_sites,
                is_default=effective_sites == global_sites,
            )

        return MetadataPrioritySettings(
            global_sites=global_sites,
            fields=MetadataPriorityFieldsConfig(**fields),
        )

    def save_settings(self, payload: MetadataPriorityUpdate):
        global_sites = self.get_global_site_order()

        for field in self.supported_fields:
            requested = list(getattr(payload.fields, field.value))
            effective_sites = self._normalize_site_order(requested, global_sites)

            query = self.db.query(MetadataPriority).filter(MetadataPriority.field_key == field.value)
            query.delete(synchronize_session=False)

            if effective_sites == global_sites:
                continue

            for index, spider_key in enumerate(effective_sites, start=1):
                MetadataPriority(
                    field_key=field.value,
                    spider_key=spider_key.value,
                    priority=index,
                ).add(self.db)

        self.db.commit()

    def get_effective_field_orders(self) -> dict[str, list[SpiderKey]]:
        global_sites = self.get_global_site_order()
        return {
            field.value: self.get_effective_site_order(field, global_sites)
            for field in self.supported_fields
        }

    def get_global_site_order(self) -> list[SpiderKey]:
        sites = self.db.query(Site).filter(Site.status == 1).order_by(Site.priority).all()
        spider_keys: list[SpiderKey] = []
        seen: set[SpiderKey] = set()

        for site in sites:
            try:
                spider_key = SpiderKey(site.spider_key)
            except ValueError:
                continue
            if spider_key in seen:
                continue
            seen.add(spider_key)
            spider_keys.append(spider_key)

        return spider_keys

    def get_effective_site_order(
        self,
        field: MetadataPriorityFieldKey,
        global_sites: list[SpiderKey] | None = None,
    ) -> list[SpiderKey]:
        if global_sites is None:
            global_sites = self.get_global_site_order()

        custom_sites = self._get_custom_site_order(field)
        return self._normalize_site_order(custom_sites, global_sites)

    def _get_custom_site_order(self, field: MetadataPriorityFieldKey) -> list[SpiderKey]:
        rows = (
            self.db.query(MetadataPriority)
            .filter(MetadataPriority.field_key == field.value)
            .order_by(MetadataPriority.priority)
            .all()
        )

        result: list[SpiderKey] = []
        seen: set[SpiderKey] = set()
        for row in rows:
            try:
                spider_key = SpiderKey(row.spider_key)
            except ValueError:
                continue
            if spider_key in seen:
                continue
            seen.add(spider_key)
            result.append(spider_key)
        return result

    @staticmethod
    def _normalize_site_order(
        requested_sites: list[SpiderKey],
        global_sites: list[SpiderKey],
    ) -> list[SpiderKey]:
        allowed = set(global_sites)
        result: list[SpiderKey] = []

        for spider_key in requested_sites:
            if spider_key not in allowed or spider_key in result:
                continue
            result.append(spider_key)

        for spider_key in global_sites:
            if spider_key not in result:
                result.append(spider_key)

        return result
