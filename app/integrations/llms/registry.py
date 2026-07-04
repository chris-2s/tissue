from app.integrations.llms.base import LlmProvider


class LlmRegistry:
    def __init__(self):
        self._providers: dict[str, type[LlmProvider]] = {}

    def register(self, provider_cls: type[LlmProvider]) -> None:
        self._providers[provider_cls.key] = provider_cls

    def get(self, key: str) -> type[LlmProvider] | None:
        return self._providers.get(key)

    def list(self) -> list[str]:
        return list(self._providers.keys())


llm_registry = LlmRegistry()
