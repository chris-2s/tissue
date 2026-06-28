from dataclasses import dataclass
from typing import Any

from app.i18n.locale import get_default_locale, normalize_locale
from app.i18n.messages import MESSAGES


class _SafeDict(dict[str, Any]):
    def __missing__(self, key: str) -> str:
        return '{' + key + '}'


@dataclass(slots=True)
class I18nText:
    key: str
    text: str
    params: dict[str, Any] | None = None
    locale: str | None = None


def build_text(
    key: str,
    params: dict[str, Any] | None = None,
    locale: str | None = None,
    default: str | None = None,
) -> I18nText:
    actual_locale = normalize_locale(locale)
    text = _resolve_text(key=key, locale=actual_locale, params=params, default=default)
    return I18nText(
        key=key,
        text=text,
        params=params or None,
        locale=actual_locale,
    )


def translate(
    key: str,
    params: dict[str, Any] | None = None,
    locale: str | None = None,
    default: str | None = None,
) -> str:
    return build_text(key=key, params=params, locale=locale, default=default).text


def _resolve_text(key: str, locale: str, params: dict[str, Any] | None, default: str | None) -> str:
    template = MESSAGES.get(locale, {}).get(key)
    if template is None:
        fallback_locale = get_default_locale()
        template = MESSAGES.get(fallback_locale, {}).get(key)

    if template is None:
        template = default if default is not None else key

    return template.format_map(_SafeDict(params or {}))
