from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any


@dataclass
class AddTorrentResult:
    success: bool
    torrent_hash: str | None = None
    message: str | None = None


class DownloaderProvider(ABC):
    key: str
    label: str

    def __init__(self, config: dict[str, Any]):
        self.config = config

    @abstractmethod
    def test_connection(self) -> None:
        pass

    @abstractmethod
    def get_completed_torrents(self, category: str | None = None, include_failed: bool = True,
                               include_success: bool = True) -> list[dict[str, Any]]:
        pass

    @abstractmethod
    def get_torrent_files(self, torrent_hash: str) -> list[dict[str, Any]]:
        pass

    @abstractmethod
    def add_magnet(self, magnet: str, save_path: str, category: str | None = None) -> AddTorrentResult:
        pass

    @abstractmethod
    def add_tags(self, torrent_hash: str, tags: list[str]) -> None:
        pass

    @abstractmethod
    def remove_tags(self, torrent_hash: str, tags: list[str]) -> None:
        pass

    @abstractmethod
    def delete_torrent(self, torrent_hash: str) -> None:
        pass

    @abstractmethod
    def get_transfer_info(self) -> Any:
        pass

