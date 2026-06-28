export default {
    pageTitle: '檔案列表',
    batchTitle: '批量整理',
    detailTitle: '檔案整理',
    searchPlaceholder: '搜尋',
    organize: '整理',
    empty: {
        title: '無檔案，',
        configure: '配置檔案',
    },
    errors: {
        loadTitle: '檔案列表加載失敗',
        loadDescription: '請檢查網路後重試',
    },
    batch: {
        modalTitle: '選中檔案',
        transMode: '轉移模式',
        transModeTooltip: '預設按系統設定處理，也可僅本次批量整理手動指定',
        transModeOptions: {
            system: '使用系統設定',
        },
        columns: {
            filename: '檔名',
            num: '番號',
            zh: '中文',
            uncensored: '無碼',
        },
    },
} as const;
