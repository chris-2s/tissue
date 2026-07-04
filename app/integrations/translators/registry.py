from app.integrations.translators.base import TranslatorProvider


class TranslatorRegistry:
    def __init__(self):
        self._providers: dict[str, type[TranslatorProvider]] = {}

    def register(self, provider_cls: type[TranslatorProvider]) -> None:
        self._providers[provider_cls.key] = provider_cls

    def get(self, key: str) -> type[TranslatorProvider] | None:
        return self._providers.get(key)

    def list(self) -> list[str]:
        return list(self._providers.keys())


translator_registry = TranslatorRegistry()
