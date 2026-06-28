import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import {initReactI18next} from 'react-i18next';

import {APP_LOCALES, DEFAULT_LOCALE, LOCALE_STORAGE_KEY, normalizeLocale, type AppLocale} from './locale';
import {resources} from './resources';
import {syncDayjsLocale} from './third-party/dayjs';

const namespaces = ['common', 'auth', 'errors', 'routes', 'about', 'setting', 'log', 'site', 'history', 'download', 'video', 'user', 'actor', 'subscribe', 'schedule', 'home', 'file', 'search'] as const;

void i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        fallbackLng: DEFAULT_LOCALE,
        supportedLngs: [...APP_LOCALES],
        load: 'currentOnly',
        resources,
        ns: [...namespaces],
        defaultNS: 'common',
        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
            lookupLocalStorage: LOCALE_STORAGE_KEY,
            convertDetectedLanguage: (lng) => normalizeLocale(lng),
        },
        interpolation: {
            escapeValue: false,
        },
    });

syncDayjsLocale((i18n.resolvedLanguage as AppLocale | undefined) ?? DEFAULT_LOCALE);

export default i18n;
