export const DEFAULT_LOCALE = 'zh-CN' as const;
export const LOCALE_STORAGE_KEY = 'locale' as const;

export const APP_LOCALES = ['zh-CN', 'zh-TW', 'en-US', 'ja-JP'] as const;

export type AppLocale = (typeof APP_LOCALES)[number];

export function normalizeLocale(value?: string | null): AppLocale {
    if (typeof value !== 'string') {
        return DEFAULT_LOCALE;
    }

    const normalized = value.trim().replace('_', '-').toLowerCase();
    if (!normalized) {
        return DEFAULT_LOCALE;
    }

    if (normalized === 'zh-tw' || normalized === 'zh-hk' || normalized === 'zh-mo'
        || normalized === 'zh-hant' || normalized.startsWith('zh-hant-')) {
        return 'zh-TW';
    }

    if (normalized === 'zh' || normalized === 'zh-cn' || normalized === 'zh-hans'
        || normalized.startsWith('zh-cn-') || normalized.startsWith('zh-hans-')) {
        return 'zh-CN';
    }

    if (normalized === 'ja' || normalized === 'ja-jp' || normalized.startsWith('ja-')) {
        return 'ja-JP';
    }

    if (normalized === 'en' || normalized === 'en-us' || normalized.startsWith('en-')) {
        return 'en-US';
    }

    return DEFAULT_LOCALE;
}

export function toRequestLanguage(locale: AppLocale): AppLocale {
    return locale;
}
