from fastapi.exceptions import HTTPException


class BizException(HTTPException):
    def __init__(self, message, code=400, **kwargs):
        super(BizException, self).__init__(code, message)
