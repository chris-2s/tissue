from fastapi import APIRouter
from pydantic import BaseModel

from app.scheduler import scheduler
from app.schema import Setting
from app.schema.r import R
from app.utils.qbittorent import qbittorent

router = APIRouter()


@router.get("/")
def get_settings():
    settings = Setting()
    return R.ok(settings)


@router.post('/')
def save_setting(section: str, setting: dict):
    Setting.write_section(section, setting)
    if section == 'download':
        trans_auto = setting.get('trans_auto')
        if trans_auto:
            scheduler.add('scrape_download')
        else:
            scheduler.remove('scrape_download')

        delete_auto = setting.get('delete_auto')
        if delete_auto:
            scheduler.add('delete_complete_download')
        else:
            scheduler.remove('delete_complete_download')

        qbittorent.host = setting.get('host')
        qbittorent.tracker_subscribe = setting.get('tracker_subscribe')

    return R.ok()
