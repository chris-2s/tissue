export default {
    pageTitle: '历史记录',
    searchPlaceholder: '搜索',
    deleteSuccess: '删除成功',
    errors: {
        loadTitle: '历史记录加载失败',
        loadDescription: '请检查网络后重试',
    },
    columns: {
        status: '状态',
        num: '番号',
        path: '路径',
        transMethod: '转移方式',
        time: '时间',
    },
    status: {
        success: '成功',
        failed: '失败',
    },
    flags: {
        zh: '中文',
        uncensored: '无码',
    },
    actions: {
        reprocess: '重新整理',
        deleteRecord: '删除记录',
    },
    confirm: {
        deleteRecord: '是否确认删除记录',
    },
    detailTitle: '重新整理',
    transMode: {
        copy: '复制',
        move: '移动',
        hardlink: '硬连接',
        symlink: '软连接',
    },
} as const;
