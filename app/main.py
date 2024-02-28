from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from app import middleware, db, exception
from app.scheduler import scheduler
from app.api import api_router

app = FastAPI()

middleware.init(app)
exception.init(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    app.include_router(api_router)
    db.init()
    scheduler.init()


if __name__ == '__main__':
    pass
