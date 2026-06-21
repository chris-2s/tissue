import types
from pathlib import Path
import sys

import pytest

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.middleware.requestvars import request_global


@pytest.fixture(autouse=True)
def reset_request_global():
    token = request_global.set(types.SimpleNamespace())
    try:
        yield
    finally:
        request_global.reset(token)
