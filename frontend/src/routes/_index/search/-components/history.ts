const HISTORY_KEY = 'search_keyword_histories_v3';

function normalizeHistoryItems(items: string[]) {
    const normalized: string[] = [];
    const seen = new Set<string>();

    for (const item of items) {
        const keyword = item.trim();
        if (!keyword) {
            continue;
        }

        const key = keyword.toUpperCase();
        if (seen.has(key)) {
            continue;
        }

        seen.add(key);
        normalized.push(keyword);
    }

    return normalized.slice(0, 20);
}

export function getSearchHistories() {
    const histories = normalizeHistoryItems(JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'));
    localStorage.setItem(HISTORY_KEY, JSON.stringify(histories));
    return histories;
}

export function cacheSearchHistory(keyword: string) {
    const normalizedKeyword = keyword.trim();
    if (!normalizedKeyword) {
        return;
    }

    const histories = getSearchHistories().filter((item) => item.toUpperCase() !== normalizedKeyword.toUpperCase());
    localStorage.setItem(HISTORY_KEY, JSON.stringify([normalizedKeyword, ...histories].slice(0, 20)));
}

export function clearSearchHistories() {
    localStorage.setItem(HISTORY_KEY, JSON.stringify([]));
}
