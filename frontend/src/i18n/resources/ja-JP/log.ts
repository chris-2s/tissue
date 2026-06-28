export default {
    title: 'ログ',
    levels: {
        all: '全部',
        issue: '問題',
        info: '情報',
        debug: 'デバッグ',
    },
    status: {
        connected: '接続済み',
        connecting: '接続中',
        closed: '切断',
        error: '接続異常',
    },
    controls: {
        autoScroll: '自動追従',
        clear: '表示クリア',
        searchPlaceholder: 'モジュール名やログ内容を検索',
    },
    empty: {
        noLogs: 'ログなし',
        noMatches: '一致するログなし',
    },
    errors: {
        connectFailed: 'ログ接続失敗: {{status}}',
    },
} as const;
