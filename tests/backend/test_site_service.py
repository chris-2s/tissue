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


def test_cookiecloud_sync_skips_validation_when_cookie_is_unchanged(monkeypatch):
    site = SimpleNamespace(
        spider_key="javdb",
        alternate_host=None,
        cookies="session=abc",
    )

    class FakeQuery:
        def all(self):
            return [site]

    class FakeCookieCloud:
        def __init__(self, host, uuid, password):
            pass

        def get_decrypted_data(self):
            return {
                "javdb.com": [
                    {"name": "session", "value": "abc", "domain": "javdb.com"},
                ],
            }

    class FakeSpider:
        origin_host = "https://javdb.com"
        closed = False

        def check_cookie_validity(self, cookie_header):
            raise AssertionError("unchanged cookies should not be validated")

        def close(self):
            self.closed = True

    db = SimpleNamespace(query=lambda _model: FakeQuery(), commit=lambda: None)
    spider = FakeSpider()
    monkeypatch.setattr(
        "app.service.cookiecloud.Setting",
        lambda: SimpleNamespace(cookiecloud=SimpleNamespace(
            enabled=True,
            host="https://cookiecloud.example",
            uuid="uuid",
            password="password",
        )),
    )
    monkeypatch.setattr("app.service.cookiecloud.PyCookieCloud", FakeCookieCloud)
    monkeypatch.setattr("app.service.cookiecloud.get_db", lambda: iter([db]))
    monkeypatch.setattr("app.service.cookiecloud.SpiderService.build_spider", lambda *args, **kwargs: spider)

    CookieCloudService().sync()

    assert spider.closed is True


def test_site_cookie_check_does_not_save_successful_validation(monkeypatch):
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

    class FakeSpider:
        name = "JavDB"
        origin_host = "https://javdb.com"
        closed = False

        def check_cookie_validity(self, cookie_header):
            return ([{"name": "session", "value": "solved"}], "Solved UA")

        def close(self):
            self.closed = True

    def fail_commit():
        raise AssertionError("successful validation should not update the site")

    def fail_push(*args, **kwargs):
        raise AssertionError("successful validation should not push CookieCloud")

    db = SimpleNamespace(query=lambda _model: FakeQuery(), commit=fail_commit)
    spider = FakeSpider()
    monkeypatch.setattr("app.service.site.SpiderService.build_spider", lambda *args, **kwargs: spider)
    monkeypatch.setattr("app.service.site.CookieCloudService.push_cookie", fail_push)

    SiteService(db)._check_cookies()

    assert site.cookies == "session=old"
    assert site.user_agent == "Old UA"
    assert spider.closed is True
