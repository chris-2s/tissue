from pathlib import Path
from typing import Any, Optional

from pydantic import BaseModel, Field


config_path = Path(f'{Path(__file__).cwd()}/config/app.conf')


class SettingLibrary(BaseModel):
    video_path: str = '/data/media'
    video_size_minimum: int = 100
    video_format: str = '.mp4,.mkv,.mov'


class SettingCrawler(BaseModel):
    timeout: int = 60
    subscribe_interval_minutes: int = Field(default=400, ge=15)
    subscribe_pause_seconds: int = Field(default=45, ge=1)


class SettingFile(BaseModel):
    path: str = '/data/file'
    trans_mode: str = 'copy'


class SettingDownload(BaseModel):
    provider: str = 'qbittorrent'
    trans_mode: str = 'copy'
    download_path: str = '/downloads'
    mapping_path: str = '/downloads'
    trans_auto: bool = False
    delete_auto: bool = False
    category: Optional[str] = ''
    providers: dict[str, dict[str, Any]] = Field(default_factory=lambda: {
        'qbittorrent': DownloaderQbittorrentConfig().model_dump()
    })

    def get_provider_payload(self, provider: str | None = None) -> dict[str, Any]:
        key = provider or self.provider
        return self.providers.get(key, {})


class SettingNotify(BaseModel):
    provider: str = 'telegram'
    providers: dict[str, dict[str, Any]] = Field(default_factory=lambda: {
        'telegram': NotifyTelegramConfig().model_dump(),
        'webhook': NotifyWebhookConfig().model_dump(),
    })

    def get_provider_payload(self, provider: str | None = None) -> dict[str, Any]:
        key = provider or self.provider
        return self.providers.get(key, {})


class DownloaderQbittorrentConfig(BaseModel):
    host: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    tracker_subscribe: Optional[str] = ''


class NotifyTelegramConfig(BaseModel):
    token: Optional[str] = None
    chat_id: Optional[str] = None


class NotifyWebhookConfig(BaseModel):
    url: Optional[str] = None


class SettingDownloadV1(BaseModel):
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


class SettingNotifyV1(BaseModel):
    type: str = 'telegram'
    webhook_url: Optional[str] = None
    telegram_token: Optional[str] = None
    telegram_chat_id: Optional[str] = None


class SettingCookieCloud(BaseModel):
    enabled: bool = False
    host: Optional[str] = None
    uuid: Optional[str] = None
    password: Optional[str] = None


class Setting(BaseModel):
    library: SettingLibrary = Field(default_factory=SettingLibrary)
    crawler: SettingCrawler = Field(default_factory=SettingCrawler)
    file: SettingFile = Field(default_factory=SettingFile)
    download: SettingDownload = Field(default_factory=SettingDownload)
    notify: SettingNotify = Field(default_factory=SettingNotify)
    cookiecloud: SettingCookieCloud = Field(default_factory=SettingCookieCloud)

    def __init__(self, **data: Any):
        if not data:
            from app.settings import settings_manager

            data = settings_manager.load()
        super().__init__(**data)

    @staticmethod
    def read():
        from app.settings import settings_manager

        return settings_manager.load()

    @staticmethod
    def write_section(section: str, setting: dict):
        from app.settings import settings_manager

        settings_manager.save_section(section, setting)
