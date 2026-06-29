from types import SimpleNamespace

import pytest

from app.exception import BizException
from app.exception.codes import ErrorCode
from app.middleware.requestvars import g
from app.schema.site import SiteUpdate
from app.service.cookiecloud import CookieCloudService
from app.service.site import SiteService


class FakeSiteRecord:
    def __init__(self):
        self.updated_payload = None

    def update(self, db, payload):
        self.updated_payload = payload


class FakeDB:
    def __init__(self):
        self.flush_calls = 0
        self.commit_calls = 0
        self.rollback_calls = 0

    def flush(self):
        self.flush_calls += 1

    def commit(self):
        self.commit_calls += 1

    def rollback(self):
        self.rollback_calls += 1


def test_get_site_raises_for_invalid_spider_key():
    service = SiteService(db=SimpleNamespace())
    db_site = SimpleNamespace(
        id=1,
        spider_key="invalid",
        priority=1,
        alternate_host=None,
        status=True,
        cookies=None,
    )

    with pytest.raises(BizException) as exc_info:
        service.get_site(db_site)

    assert exc_info.value.error_code == ErrorCode.SITE_TYPE_NOT_FOUND
    assert exc_info.value.error_params == {"spider_key": "invalid"}


def test_modify_site_normalizes_cookie_header(monkeypatch):
    service = SiteService(db=FakeDB())
    site_record = FakeSiteRecord()
    g().db = service.db

    monkeypatch.setattr("app.service.site.Site.get", lambda db, site_id: site_record)

    service.modify_site(
        SiteUpdate(
            id=1,
            priority=10,
            alternate_host="https://example.com",
            status=True,
            cookies=" foo=bar baz ; token=a%2Fb ",
        )
    )

    assert site_record.updated_payload is not None
    assert site_record.updated_payload["cookies"] == "foo=bar%20baz; token=a/b"


def test_modify_site_converts_empty_cookie_header_to_none(monkeypatch):
    service = SiteService(db=FakeDB())
    site_record = FakeSiteRecord()
    g().db = service.db

    monkeypatch.setattr("app.service.site.Site.get", lambda db, site_id: site_record)

    service.modify_site(
        SiteUpdate(
            id=1,
            priority=10,
            alternate_host=None,
            status=True,
            cookies=" ; ",
        )
    )

    assert site_record.updated_payload["cookies"] is None


def test_find_matching_cookies_collects_domain_and_subdomain_only():
    service = CookieCloudService()
    cookie_dict = {
        "javdb.com": [{"name": "root", "value": "1", "domain": "javdb.com"}],
        "www.javdb.com": [{"name": "www", "value": "2", "domain": "www.javdb.com"}],
        "eviljavdb.com": [{"name": "evil", "value": "3", "domain": "eviljavdb.com"}],
    }

    matched_entries = service._find_matching_cookie_entries("https://www.javdb.com", cookie_dict)
    matched = service._merge_cookie_entries(matched_entries)

    assert matched == [
        {"name": "root", "value": "1", "domain": "javdb.com"},
        {"name": "www", "value": "2", "domain": "www.javdb.com"},
    ]
