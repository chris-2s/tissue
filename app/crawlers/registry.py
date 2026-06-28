from dataclasses import dataclass

from app.crawlers.base import Spider
from app.crawlers.capabilities import CrawlerCapabilities
from app.crawlers.providers.dmm import DmmSpider
from app.crawlers.providers.jav321 import Jav321Spider
from app.crawlers.providers.javbus import JavBusSpider
from app.crawlers.providers.javdb import JavDBSpider
from app.schema.site import SpiderKey


@dataclass(frozen=True)
class CrawlerDefinition:
    key: SpiderKey
    spider_cls: type[Spider]
    capabilities: CrawlerCapabilities


class CrawlerRegistry:
    def __init__(self):
        self._providers: dict[SpiderKey, CrawlerDefinition] = {}

    @staticmethod
    def normalize_key(spider_key: str | SpiderKey) -> SpiderKey | None:
        if isinstance(spider_key, SpiderKey):
            return spider_key
        try:
            return SpiderKey(spider_key)
        except ValueError:
            return None

    def register(self, key: SpiderKey, spider_cls: type[Spider]) -> None:
        self._providers[key] = CrawlerDefinition(
            key=key,
            spider_cls=spider_cls,
            capabilities=CrawlerCapabilities(
                supports_ranking=spider_cls.supports_ranking,
                supports_actor=spider_cls.supports_actor,
                supports_login=spider_cls.supports_login,
                supports_downloads=spider_cls.supports_downloads,
                supports_previews=spider_cls.supports_previews,
                supports_comments=spider_cls.supports_comments,
            ),
        )

    def get(self, spider_key: str | SpiderKey) -> type[Spider] | None:
        normalized_key = self.normalize_key(spider_key)
        if not normalized_key:
            return None
        definition = self._providers.get(normalized_key)
        return definition.spider_cls if definition else None

    def get_definition(self, spider_key: str | SpiderKey) -> CrawlerDefinition | None:
        normalized_key = self.normalize_key(spider_key)
        if not normalized_key:
            return None
        return self._providers.get(normalized_key)

    def get_capabilities(self, spider_key: str | SpiderKey) -> CrawlerCapabilities:
        definition = self.get_definition(spider_key)
        return definition.capabilities.model_copy() if definition else CrawlerCapabilities()


crawler_registry = CrawlerRegistry()
crawler_registry.register(SpiderKey.JAVDB, JavDBSpider)
crawler_registry.register(SpiderKey.JAVBUS, JavBusSpider)
crawler_registry.register(SpiderKey.JAV321, Jav321Spider)
crawler_registry.register(SpiderKey.DMM, DmmSpider)
