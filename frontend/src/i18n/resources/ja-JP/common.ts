export default {
    actions: {
        add: '追加',
        cancel: '取消',
        clear: 'クリア',
        close: '閉じる',
        confirm: '確認',
        delete: '削除',
        edit: '編集',
        refresh: '更新',
        retry: '再試行',
        save: '保存',
        search: '検索',
        submit: '送信',
    },
    theme: {
        system: '自動',
        light: '明',
        dark: '暗',
    },
    feedback: {
        settingsSaved: '保存完了',
    },
    pin: {
        incorrect: '暗証誤り',
        mismatch: '2回の入力が不一致',
        setSuccess: '暗証設定完了',
        cleared: '暗証解除完了',
        enter: '暗証を入力',
        repeat: '再度入力',
        clear: '暗証を解除',
        warning: '環境や互換性の制約で信頼性は保証できません',
    },
    pullToRefresh: {
        pulling: '下へ更新',
        release: '離して更新',
        refreshing: '更新中...',
    },
    state: {
        empty: 'データなし',
        loading: '読込中',
        noImage: '画像なし',
    },
} as const;
