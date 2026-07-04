from app.exception import BizException
from app.exception.codes import ErrorCode
from app.integrations.translators.base import TranslatorProvider
from app.integrations.translators.registry import translator_registry
from app.schema.setting import Setting


class TranslatorManager:
    def __init__(self):
        self._provider: TranslatorProvider | None = None
        self._provider_key: str | None = None
        self._provider_signature: tuple | None = None

    def refresh(self) -> None:
        self._provider = None
        self._provider_key = None
        self._provider_signature = None

    def get_active(self) -> TranslatorProvider:
        setting = Setting().translate
        provider_key = setting.type
        provider_cls = translator_registry.get(provider_key)
        if provider_cls is None:
            raise BizException(
                '不支持的翻译器',
                error_code=ErrorCode.PROVIDER_UNSUPPORTED,
                error_params={'provider': provider_key},
            )

        provider_config = setting.get_provider_payload(provider_key)
        signature = tuple(sorted(provider_config.items()))
        if self._provider is None or self._provider_key != provider_key or self._provider_signature != signature:
            self._provider = provider_cls(provider_config)
            self._provider_key = provider_key
            self._provider_signature = signature
        return self._provider


translator_manager = TranslatorManager()
