export default {
    pageTitle: '文件列表',
    batchTitle: '批量整理',
    detailTitle: '文件整理',
    searchPlaceholder: '搜索',
    organize: '整理',
    empty: {
        title: '无文件，',
        configure: '配置文件',
    },
    errors: {
        loadTitle: '文件列表加载失败',
        loadDescription: '请检查网络后重试',
    },
    batch: {
        modalTitle: '选中文件',
        transMode: '转移模式',
        transModeTooltip: '默认按系统设置处理，也可仅本次批量整理手动指定',
        transModeOptions: {
            system: '使用系统设置',
        },
        columns: {
            filename: '文件名',
            num: '番号',
            zh: '中文',
            uncensored: '无码',
        },
    },
} as const;
