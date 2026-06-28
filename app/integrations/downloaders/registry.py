from app.integrations.downloaders.base import DownloaderProvider
from app.integrations.downloaders.providers.qbittorrent import QBittorrentDownloader


class DownloaderRegistry:
    def __init__(self):
        self._providers: dict[str, type[DownloaderProvider]] = {}

    def register(self, provider_cls: type[DownloaderProvider]) -> None:
        self._providers[provider_cls.key] = provider_cls

    def get(self, key: str) -> type[DownloaderProvider] | None:
        return self._providers.get(key)

    def keys(self) -> list[str]:
        return list(self._providers.keys())


downloader_registry = DownloaderRegistry()
downloader_registry.register(QBittorrentDownloader)

