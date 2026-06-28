from fastapi.exceptions import HTTPException

from app.exception.codes import ErrorCode


class BizException(HTTPException):
    def __init__(
        self,
        message: str,
        status_code: int = 400,
        error_code: str = ErrorCode.REQUEST_FAILED,
        error_params: dict[str, str | int | float | bool | None] | None = None,
        **kwargs
    ):
        super(BizException, self).__init__(status_code, message)
        self.message = message
        self.error_code = error_code
        self.error_params = error_params
