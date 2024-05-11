from fastapi import FastAPI

from app import middleware, db, exception
from app.scheduler import scheduler
from app.api import api_router

app = FastAPI()

middleware.init(app)
exception.init(app)


@app.on_event("startup")
def on_startup():
    app.include_router(api_router)
    db.init()
    scheduler.init()


if __name__ == '__main__':
    pass
