import pytest

from app.db.transaction import transaction
from app.middleware.requestvars import g


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


def test_transaction_commits_for_top_level_call():
    db = FakeDB()
    g().db = db

    @transaction
    def do_work():
        return "ok"

    assert do_work() == "ok"
    assert db.flush_calls == 1
    assert db.commit_calls == 1
    assert db.rollback_calls == 0
    assert g().transaction_started is False


def test_transaction_rolls_back_on_exception():
    db = FakeDB()
    g().db = db

    @transaction
    def do_work():
        raise RuntimeError("boom")

    with pytest.raises(RuntimeError, match="boom"):
        do_work()

    assert db.commit_calls == 0
    assert db.rollback_calls == 1
    assert g().transaction_started is False


def test_transaction_skips_nested_commit():
    db = FakeDB()
    g().db = db

    @transaction
    def inner():
        return "inner"

    @transaction
    def outer():
        return inner()

    assert outer() == "inner"
    assert db.flush_calls == 2
    assert db.commit_calls == 1
    assert db.rollback_calls == 0
