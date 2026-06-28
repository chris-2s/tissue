export default {
    pageTitle: '訂閱',
    deleteSuccess: '刪除成功',
    errors: {
        loadTitle: '訂閱列表加載失敗',
        loadDescription: '請檢查網路後重試',
    },
    empty: {
        title: '無訂閱',
    },
    flags: {
        hd: '高清',
        zh: '中文',
        uncensored: '無碼',
    },
    filter: {
        searchPlaceholder: '搜尋番號、演員，或輸入標題後按 Enter',
        currentFilters: '目前條件',
        clearFilters: '清空條件',
        token: {
            num: '番號',
            actor: '演員',
            title: '標題',
        },
    },
    modal: {
        createTitle: '新增訂閱',
        editTitle: '編輯訂閱',
        emptyValue: '暫無',
        numRequired: '請輸入番號',
        deleteConfirm: '是否確認刪除',
        regexTooltip: '支援正則表達式',
        fields: {
            num: '番號',
            premiered: '發布日期',
            title: '標題',
            actors: '演員',
            includeKeyword: '包含關鍵字',
            excludeKeyword: '排除關鍵字',
            hd: '高清',
            zh: '中文',
            uncensored: '無碼',
        },
    },
    history: {
        title: '訂閱歷史',
        total: '共 {{count}} 筆',
        empty: '暫無訂閱歷史',
        noActors: '暫無演員資訊',
        resubscribeSuccess: '重新訂閱成功',
        deleteSuccess: '訂閱歷史刪除成功',
        actions: {
            search: '搜尋',
            more: '更多',
            resubscribe: '重新訂閱',
            delete: '刪除',
        },
        confirm: {
            resubscribe: '確認重新訂閱這筆記錄？',
            delete: '確認刪除這筆訂閱歷史？',
        },
    },
} as const;
