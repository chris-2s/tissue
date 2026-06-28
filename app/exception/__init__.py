from fastapi import FastAPI
from fastapi.responses import JSONResponse

from app.exception.authorization import AuthorizationException
from app.exception.authentication import AuthenticationException
from app.exception.biz import BizException
from app.exception.codes import ErrorCode
from app.i18n import translate
from app.schema.error import ErrorResponse
from app.utils.logger import logger


def init(app: FastAPI):
    @app.exception_handler(AuthenticationException)
    def handle_authorization_exception(_, exc: AuthenticationException):
        return JSONResponse(
            status_code=401,
            content=ErrorResponse(
                details=exc.message,
                message=exc.message,
                error={'code': exc.error_code, 'params': exc.error_params},
            ).model_dump()
        )

    @app.exception_handler(AuthorizationException)
    def handle_access_denied_exception(_, exc: AuthorizationException):
        return JSONResponse(
            status_code=403,
            content=ErrorResponse(
                details=exc.message,
                message=exc.message,
                error={'code': exc.error_code, 'params': exc.error_params},
            ).model_dump()
        )

    @app.exception_handler(BizException)
    def handle_biz_exception(_, exc: BizException):
        return JSONResponse(
            status_code=exc.status_code,
            content=ErrorResponse(
                details=exc.detail,
                message=exc.detail,
                error={'code': exc.error_code, 'params': exc.error_params},
            ).model_dump()
        )

    @app.exception_handler(Exception)
    def handle_exception(_, exc: Exception):
        logger.error(translate('log.exception.unhandled', {'error': str(exc)}))
        return JSONResponse(
            status_code=500,
            content=ErrorResponse(
                details=translate('message.unknown_error'),
                message=translate('message.unknown_error'),
                error={'code': ErrorCode.UNKNOWN_ERROR, 'params': None},
            ).model_dump()
        )
