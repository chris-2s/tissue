from fastapi import FastAPI, Response

from app.exception.authorization import AuthorizationException
from app.exception.authentication import AuthenticationException
from app.exception.biz import BizException
from app.utils.logger import logger


def init(app: FastAPI):
    @app.exception_handler(AuthenticationException)
    def handle_authorization_exception(*_: any):
        return Response('身份验证失败', status_code=401)

    @app.exception_handler(AuthorizationException)
    def handle_access_denied_exception(*_: any):
        return Response('您无权访问此操作', status_code=403)

    @app.exception_handler(BizException)
    def handle_biz_exception(_, exc: BizException):
        return Response(exc.detail, status_code=400)

    @app.exception_handler(Exception)
    def handle_exception(_, exc: Exception):
        logger.error("未知错误，请查看控制台日志")
        return Response('未知错误', status_code=500)
