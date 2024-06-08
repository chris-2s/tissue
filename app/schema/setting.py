from configparser import ConfigParser
from pathlib import Path
from typing import Optional

from pydantic import BaseModel


class SettingApp(BaseModel):
    user_agent: str = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
    timeout: int = 60

    video_path: str = '/data/media'

    video_size_minimum: int = 100
    video_format: str = '.mp4,.mkv,.mov'


class SettingFile(BaseModel):
    path: str = '/data/file'
    trans_mode: str = 'copy'


class SettingDownload(BaseModel):
    host: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    trans_mode: str = 'copy'
    download_path: str = '/downloads'
    mapping_path: str = '/downloads'
    trans_auto: bool = False
    delete_auto: bool = False
    category: Optional[str] = ''
    tracker_subscribe: Optional[str] = ''


class SettingNotify(BaseModel):
    type: str = 'telegram'

    webhook_url: Optional[str] = None

    telegram_token: Optional[str] = None
    telegram_chat_id: Optional[str] = None


config_path = Path(f'{Path(__file__).cwd()}/config/app.conf')


class Setting(BaseModel):
    app: SettingApp = SettingApp()
    file: SettingFile = SettingFile()
    download: SettingDownload = SettingDownload()
    notify: SettingNotify = SettingNotify()

    def __init__(self):
        settings = Setting.read()
        super().__init__(**settings)

    @staticmethod
    def read():
        parser = ConfigParser()
        parser.read(config_path)
        sections = parser.sections()
        setting = {}
        for section in sections:
            setting[section] = dict(parser.items(section))

        return setting

    @staticmethod
    def write_section(section: str, setting: dict):
        parser = ConfigParser()
        parser.read(config_path)
        parser[section] = setting
        with open(config_path, 'w') as file:
            parser.write(file)
