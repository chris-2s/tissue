import enUS from 'antd/locale/en_US';
import jaJP from 'antd/locale/ja_JP';
import zhCN from 'antd/locale/zh_CN';
import zhTW from 'antd/locale/zh_TW';

import type {AppLocale} from '../locale';

const antdLocales = {
    'zh-CN': zhCN,
    'zh-TW': zhTW,
    'en-US': enUS,
    'ja-JP': jaJP,
} as const;

export function getAntdLocale(locale: AppLocale) {
    return antdLocales[locale];
}
