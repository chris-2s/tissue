import os
import secrets
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import jwt
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext

oauth2_optional_scheme = OAuth2PasswordBearer(tokenUrl=f"/auth/login", auto_error=False)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
algorithm = "HS256"
jwt_secret_path = Path(f'{Path(__file__).cwd()}/config/jwt_secret')
default_access_token_expire_hours = int(os.getenv('ACCESS_TOKEN_EXPIRE_HOURS', '12'))
default_remember_token_expire_days = int(os.getenv('REMEMBER_TOKEN_EXPIRE_DAYS', '365'))


def _write_secret_file(secret: str):
    jwt_secret_path.parent.mkdir(parents=True, exist_ok=True)
    jwt_secret_path.write_text(secret, encoding='utf-8')
    os.chmod(jwt_secret_path, 0o600)


def load_jwt_secret() -> str:
    env_secret = os.getenv('JWT_SECRET')
    if env_secret:
        return env_secret

    if jwt_secret_path.exists():
        secret = jwt_secret_path.read_text(encoding='utf-8').strip()
        if secret:
            return secret

    secret = secrets.token_urlsafe(48)
    _write_secret_file(secret)
    return secret


secret_key = load_jwt_secret()


def verify_password(password: str, hashed_password: str) -> bool:
    return pwd_context.verify(password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def get_access_token_expire_delta(remember: bool = False) -> timedelta:
    if remember:
        return timedelta(days=default_remember_token_expire_days)
    return timedelta(hours=default_access_token_expire_hours)


def create_access_token(subject: str | Any, remember: bool = False) -> str:
    now = datetime.now(timezone.utc)
    expire = now + get_access_token_expire_delta(remember)
    payload = {"exp": expire, "iat": now, "sub": str(subject)}
    encoded_jwt = jwt.encode(payload, secret_key, algorithm=algorithm)
    return encoded_jwt
