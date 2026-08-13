from types import SimpleNamespace

import pytest

from app.exception import BizException
from app.exception.codes import ErrorCode
from app.middleware.requestvars import g
from app.schema.site import SiteUpdate
from app.service.site import SiteService
from app.service.site_cookie import SiteCookieService


class FakeSiteRecord:
    def __init__(self):
        self.spider_key = 'javdb'
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


def test_get_site_uses_first_supported_language_when_database_value_is_missing():
    service = SiteService(db=SimpleNamespace())
    db_site = SimpleNamespace(
        id=1,
        spider_key='javdb',
        priority=1,
        alternate_host=None,
        status=True,
        cookies=None,
        language=None,
    )

    result = service.get_site(db_site)

    assert result.language == 'ja-JP'
    assert result.supported_languages == ('ja-JP',)


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
    service = SiteCookieService()
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


def test_cookie_maintenance_validates_remote_cookie_and_updates_cookie_and_user_agent(monkeypatch):
    site = SimpleNamespace(
        id=1,
        spider_key="javdb",
        alternate_host=None,
        cookies="session=abc",
        user_agent="Old UA",
    )

    class FakeQuery:
        def filter(self, *args):
            return self

        def all(self):
            return [site]

        def update(self, payload, synchronize_session=False):
            for key, value in payload.items():
                setattr(site, key, value)
            return 1

    class FakeDB:
        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc_val, exc_tb):
            return False

        def query(self, _model):
            return FakeQuery()

        def expunge_all(self):
            pass

        def commit(self):
            pass

    class FakeSpider:
        name = "JavDB"
        origin_host = "https://javdb.com"
        supports_login = True
        closed = False
        checked_cookie = None

        def check_cookie_validity(self, cookie_header):
            self.checked_cookie = cookie_header
            return 'valid', [{"name": "session", "value": "solved"}], "Solved UA"

        def close(self):
            self.closed = True

    spider = FakeSpider()
    service = SiteCookieService()
    monkeypatch.setattr("app.service.site_cookie.SessionFactory", FakeDB)
    monkeypatch.setattr(service, "_load_remote_cookies", lambda: {
        "javdb.com": [
            {"name": "session", "value": "abc", "domain": "javdb.com"},
        ],
    })
    monkeypatch.setattr("app.service.site_cookie.SpiderService.build_spider", lambda *args, **kwargs: spider)

    service.maintain()

    assert spider.checked_cookie == "session=abc"
    assert site.cookies == "session=solved"
    assert site.user_agent == "Solved UA"
    assert spider.closed is True


def test_cookie_maintenance_does_not_save_successful_local_validation(monkeypatch):
    site = SimpleNamespace(
        id=1,
        spider_key="javdb",
        alternate_host=None,
        cookies="session=old",
        user_agent="Old UA",
    )

    class FakeQuery:
        def filter(self, *args):
            return self

        def all(self):
            return [site]

    class FakeDB:
        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc_val, exc_tb):
            return False

        def query(self, _model):
            return FakeQuery()

        def expunge_all(self):
            pass

    class FakeSpider:
        name = "JavDB"
        origin_host = "https://javdb.com"
        supports_login = True
        closed = False

        def check_cookie_validity(self, cookie_header):
            return 'valid', [{"name": "session", "value": "solved"}], "Solved UA"

        def close(self):
            self.closed = True

    spider = FakeSpider()
    service = SiteCookieService()
    monkeypatch.setattr("app.service.site_cookie.SessionFactory", FakeDB)
    monkeypatch.setattr(service, "_load_remote_cookies", lambda: None)
    monkeypatch.setattr("app.service.site_cookie.SpiderService.build_spider", lambda *args, **kwargs: spider)
    monkeypatch.setattr(
        service,
        "_store_cookie",
        lambda *args, **kwargs: pytest.fail("successful local validation should not update the site"),
    )

    service.maintain()

    assert site.cookies == "session=old"
    assert site.user_agent == "Old UA"
    assert spider.closed is True


def test_cookie_maintenance_only_checks_enabled_login_sites(monkeypatch):
    enabled_login_site = SimpleNamespace(
        id=1,
        spider_key="login",
        alternate_host=None,
        cookies="session=login",
        user_agent=None,
    )
    enabled_public_site = SimpleNamespace(
        id=2,
        spider_key="public",
        alternate_host=None,
        cookies="session=public",
        user_agent=None,
    )
    query_filtered = False

    class FakeQuery:
        def filter(self, *args):
            nonlocal query_filtered
            query_filtered = True
            return self

        def all(self):
            return [enabled_login_site, enabled_public_site]

    class FakeDB:
        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc_val, exc_tb):
            return False

        def query(self, _model):
            return FakeQuery()

        def expunge_all(self):
            pass

    checked_sites = []

    class FakeSpider:
        name = "Fake"
        origin_host = "https://example.com"

        def __init__(self, site):
            self.site = site
            self.supports_login = site.spider_key == "login"

        def check_cookie_validity(self, cookie_header):
            checked_sites.append(self.site.spider_key)
            return 'valid', [], ''

        def close(self):
            pass

    service = SiteCookieService()
    monkeypatch.setattr("app.service.site_cookie.SessionFactory", FakeDB)
    monkeypatch.setattr(service, "_load_remote_cookies", lambda: None)
    monkeypatch.setattr(
        "app.service.site_cookie.SpiderService.build_spider",
        lambda site, include_cookies=False: FakeSpider(site),
    )

    service.maintain()

    assert query_filtered is True
    assert checked_sites == ["login"]
