from pydantic import BaseModel


class ErrorDetail(BaseModel):
    code: str
    params: dict[str, str | int | float | bool | None] | None = None


class ErrorResponse(BaseModel):
    success: bool = False
    details: str | None = None
    message: str | None = None
    error: ErrorDetail
