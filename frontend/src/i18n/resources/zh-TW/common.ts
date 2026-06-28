export default {
    actions: {
        add: '新增',
        cancel: '取消',
        clear: '清空',
        close: '關閉',
        confirm: '確認',
        delete: '刪除',
        edit: '編輯',
        refresh: '刷新',
        retry: '重試',
        save: '保存',
        search: '搜尋',
        submit: '提交',
    },
    theme: {
        system: '跟隨系統',
        light: '明亮',
        dark: '暗黑',
    },
    feedback: {
        settingsSaved: '設定成功',
    },
    pin: {
        incorrect: '密碼錯誤',
        mismatch: '兩次輸入密碼不匹配',
        setSuccess: '密碼設定成功',
        cleared: '密碼取消成功',
        enter: '請輸入密碼',
        repeat: '請再次輸入密碼',
        clear: '清空密碼',
        warning: '由於系統及相容性限制，可靠性無法保證',
    },
    pullToRefresh: {
        pulling: '下拉刷新',
        release: '鬆開刷新',
        refreshing: '刷新中...',
    },
    state: {
        empty: '暫無資料',
        loading: '加載中',
        noImage: '暫無圖片',
    },
} as const;
