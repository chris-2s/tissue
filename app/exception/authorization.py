from app.exception.codes import ErrorCode


class AuthorizationException(Exception):
    def __init__(self, message: str = '无权限访问', error_code: str = ErrorCode.AUTH_FORBIDDEN):
        super().__init__(message)
        self.message = message
        self.error_code = error_code
        self.error_params = None
