const LANGUAGE_LABELS: Record<string, string> = {
    'ja-JP': '日本語',
    'zh-CN': '简体中文',
    'zh-TW': '繁體中文',
    'en-US': 'English',
}

export function getLanguageLabel(language: string): string {
    return LANGUAGE_LABELS[language] || language
}
