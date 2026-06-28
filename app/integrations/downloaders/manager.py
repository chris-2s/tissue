from app.exception import BizException
from app.integrations.downloaders.base import DownloaderProvider
from app.integrations.downloaders.registry import downloader_registry
from app.schema import Setting


class DownloaderManager:
    def __init__(self):
        self._provider: DownloaderProvider | None = None
        self._provider_key: str | None = None
        self._provider_signature: tuple | None = None

    def refresh(self) -> None:
        self._provider = None
        self._provider_key = None
        self._provider_signature = None

    def get_active(self) -> DownloaderProvider:
        setting = Setting().download
        provider_key = setting.provider
        provider_cls = downloader_registry.get(provider_key)
        if provider_cls is None:
            raise BizException(f'不支持的下载器: {provider_key}')

        provider_config = setting.get_provider_payload(provider_key)
        signature = tuple(sorted(provider_config.items()))
        if self._provider is None or self._provider_key != provider_key or self._provider_signature != signature:
            self._provider = provider_cls(provider_config)
            self._provider_key = provider_key
            self._provider_signature = signature
        return self._provider


downloader_manager = DownloaderManager()

