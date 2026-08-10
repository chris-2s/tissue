import jwt
import pytest

from app.utils.security import (
    create_access_token,
    create_log_stream_token,
    decode_log_stream_token,
)


def test_log_stream_token_round_trip():
    token = create_log_stream_token(42)

    assert decode_log_stream_token(token) == 42


def test_access_token_cannot_authenticate_log_stream():
    token = create_access_token(42)

    with pytest.raises(jwt.InvalidTokenError):
        decode_log_stream_token(token)
