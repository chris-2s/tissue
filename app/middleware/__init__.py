import types

from fastapi import FastAPI, Request

from . import requestvars


def init(app: FastAPI):
    @app.middleware('http')
    async def init_request_vars(request: Request, call_next):
        initial_g = types.SimpleNamespace()
        requestvars.request_global.set(initial_g)
        response = await call_next(request)
        return response
