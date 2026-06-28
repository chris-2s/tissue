from app.crawlers.registry import crawler_registry
from app.schema.site import SpiderKey


def test_crawler_registry_returns_registered_class():
    spider_cls = crawler_registry.get(SpiderKey.JAVDB)

    assert spider_cls is not None
    assert spider_cls.__name__ == "JavDBSpider"


def test_crawler_registry_returns_capabilities():
    capabilities = crawler_registry.get_capabilities("javbus")

    assert capabilities.supports_actor is True
    assert capabilities.supports_downloads is True
    assert capabilities.supports_previews is True
    assert capabilities.supports_comments is False

