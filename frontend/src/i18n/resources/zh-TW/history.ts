export default {
    pageTitle: '歷史記錄',
    searchPlaceholder: '搜尋',
    deleteSuccess: '刪除成功',
    errors: {
        loadTitle: '歷史記錄加載失敗',
        loadDescription: '請檢查網路後重試',
    },
    columns: {
        status: '狀態',
        num: '番號',
        path: '路徑',
        transMethod: '轉移方式',
        time: '時間',
    },
    status: {
        success: '成功',
        failed: '失敗',
    },
    flags: {
        zh: '中文',
        uncensored: '無碼',
    },
    actions: {
        reprocess: '重新整理',
        deleteRecord: '刪除記錄',
    },
    confirm: {
        deleteRecord: '是否確認刪除記錄',
    },
    detailTitle: '重新整理',
    transMode: {
        copy: '複製',
        move: '移動',
        hardlink: '硬連結',
        symlink: '軟連結',
    },
} as const;
