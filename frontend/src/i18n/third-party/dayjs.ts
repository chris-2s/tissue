import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/en';
import 'dayjs/locale/ja';
import 'dayjs/locale/zh-cn';
import 'dayjs/locale/zh-tw';

import type {AppLocale} from '../locale';

dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);

const dayjsLocales: Record<AppLocale, string> = {
    'zh-CN': 'zh-cn',
    'zh-TW': 'zh-tw',
    'en-US': 'en',
    'ja-JP': 'ja',
};

export function syncDayjsLocale(locale: AppLocale) {
    dayjs.locale(dayjsLocales[locale]);
}
