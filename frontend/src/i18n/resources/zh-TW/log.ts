export default {
    title: '日誌',
    levels: {
        all: '全部',
        issue: '問題',
        info: '資訊',
        debug: '除錯',
    },
    status: {
        connected: '已連線',
        connecting: '連線中',
        closed: '已關閉',
        error: '連線異常',
    },
    controls: {
        autoScroll: '自動滾動',
        clear: '清空視圖',
        searchPlaceholder: '搜尋模組或日誌內容',
    },
    empty: {
        noLogs: '暫無日誌',
        noMatches: '沒有匹配的日誌',
    },
    errors: {
        connectFailed: '日誌連線失敗: {{status}}',
    },
} as const;
