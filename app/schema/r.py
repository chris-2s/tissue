from typing import Any, TypeVar, Generic, Self, List

from pydantic import BaseModel

DataT = TypeVar("DataT")


class Response(BaseModel, Generic[DataT]):
    success: bool = True
    details: str | None = None
    data: DataT | None = None
    total: int | None = None


class R(Response):

    @classmethod
    def ok(cls, data: DataT | None = None, message: str | None = None) -> Self:
        return R(success=True, details=message, data=data)

    @classmethod
    def list(cls, data: DataT, total: int | None = None, message: str | None = None) -> Response:
        return R(success=True, details=message, data=data, total=total)
