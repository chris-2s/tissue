from fastapi import APIRouter
from pydantic import BaseModel

from app.schema import Setting
from app.schema.r import R

router = APIRouter()


@router.get("/")
def get_settings():
    settings = Setting()
    return R.ok(settings)


@router.post('/')
def save_setting(section: str, setting: dict):
    Setting.write_section(section, setting)
    return R.ok()
