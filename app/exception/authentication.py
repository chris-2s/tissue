from app.exception.codes import ErrorCode


class AuthenticationException(Exception):
    def __init__(self, message: str = '未授权访问', error_code: str = ErrorCode.AUTH_UNAUTHORIZED):
        super().__init__(message)
        self.message = message
        self.error_code = error_code
        self.error_params = None
