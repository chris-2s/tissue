from fastapi import APIRouter

from app.schema import SettingReadRequest, SettingSaveRequest, Setting
from app.schema.r import R
from app.service.setting import SettingService

router = APIRouter()


@router.post('/read')
def read_settings(payload: SettingReadRequest):
    return R.ok(Setting.read_sections(payload.sections))


@router.post('/save')
def save_settings(payload: SettingSaveRequest):
    SettingService.save_sections(payload.sections)
    return R.ok()
