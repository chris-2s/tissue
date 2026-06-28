import os
from functools import lru_cache


DEFAULT_LOCALE = 'zh-CN'
SUPPORTED_LOCALES = ('zh-CN', 'zh-TW', 'en-US', 'ja-JP')

_LOCALE_ALIASES = {
    'zh': 'zh-CN',
    'zh-cn': 'zh-CN',
    'zh_hans': 'zh-CN',
    'zh-hans': 'zh-CN',
    'zh-tw': 'zh-TW',
    'zh_hant': 'zh-TW',
    'zh-hant': 'zh-TW',
    'zh-hk': 'zh-TW',
    'zh-mo': 'zh-TW',
    'en': 'en-US',
    'en-us': 'en-US',
    'ja': 'ja-JP',
    'ja-jp': 'ja-JP',
}


def normalize_locale(locale: str | None) -> str:
    if not locale:
        return get_default_locale()

    normalized = locale.strip().replace('_', '-')
    if not normalized:
        return get_default_locale()

    lowered = normalized.lower()
    if lowered in _LOCALE_ALIASES:
        return _LOCALE_ALIASES[lowered]

    for supported in SUPPORTED_LOCALES:
        if lowered == supported.lower():
            return supported

    language = lowered.split('-', 1)[0]
    return _LOCALE_ALIASES.get(language, get_default_locale())


@lru_cache(maxsize=1)
def get_default_locale() -> str:
    return normalize_locale_from_env(os.getenv('DEFAULT_LOCALE'))


def normalize_locale_from_env(locale: str | None) -> str:
    if not locale:
        return DEFAULT_LOCALE

    normalized = locale.strip().replace('_', '-')
    if not normalized:
        return DEFAULT_LOCALE

    lowered = normalized.lower()
    if lowered in _LOCALE_ALIASES:
        return _LOCALE_ALIASES[lowered]

    for supported in SUPPORTED_LOCALES:
        if lowered == supported.lower():
            return supported

    return DEFAULT_LOCALE
