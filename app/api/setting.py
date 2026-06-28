from fastapi import APIRouter

from app.schema import Setting
from app.schema.r import R
from app.service.setting import SettingService

router = APIRouter()


@router.get("/")
def get_settings():
    settings = Setting()
    return R.ok(settings)


@router.post('/')
def save_setting(section: str, setting: dict):
    SettingService.save_section(section, setting)
    return R.ok()
