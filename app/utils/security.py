from datetime import datetime, timedelta
from typing import Any

import jwt
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"/auth/login")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
secret_key = "ULDFZslsFEzL2pSm"
algorithm = "HS256"


def verify_password(password: str, hashed_password: str) -> bool:
    return pwd_context.verify(password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(subject: str | Any) -> str:
    expire = datetime.now() + timedelta(minutes=60 * 24 * 8)
    payload = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(payload, secret_key, algorithm=algorithm)
    return encoded_jwt
