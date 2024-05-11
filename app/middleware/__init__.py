import types

from fastapi import FastAPI, Request
from starlette.middleware.cors import CORSMiddleware

from . import requestvars


def init(app: FastAPI):
    @app.middleware('http')
    async def init_request_vars(request: Request, call_next):
        initial_g = types.SimpleNamespace()
        requestvars.request_global.set(initial_g)
        response = await call_next(request)
        return response

    app.add_middleware(
        CORSMiddleware,
        allow_origins=['*'],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
