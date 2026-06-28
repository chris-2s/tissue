export default {
    pageTitle: '订阅',
    deleteSuccess: '删除成功',
    errors: {
        loadTitle: '订阅列表加载失败',
        loadDescription: '请检查网络后重试',
    },
    empty: {
        title: '无订阅',
    },
    flags: {
        hd: '高清',
        zh: '中文',
        uncensored: '无码',
    },
    filter: {
        searchPlaceholder: '搜索番号、演员，或输入标题后回车',
        currentFilters: '当前条件',
        clearFilters: '清空条件',
        token: {
            num: '番号',
            actor: '演员',
            title: '标题',
        },
    },
    modal: {
        createTitle: '新增订阅',
        editTitle: '编辑订阅',
        emptyValue: '暂无',
        numRequired: '请输入番号',
        deleteConfirm: '是否确认删除',
        regexTooltip: '支持正则表达式',
        fields: {
            num: '番号',
            premiered: '发布日期',
            title: '标题',
            actors: '演员',
            includeKeyword: '包含关键字',
            excludeKeyword: '排除关键字',
            hd: '高清',
            zh: '中文',
            uncensored: '无码',
        },
    },
    history: {
        title: '订阅历史',
        total: '共 {{count}} 条',
        empty: '暂无订阅历史',
        noActors: '暂无演员信息',
        resubscribeSuccess: '重新订阅成功',
        deleteSuccess: '订阅历史删除成功',
        actions: {
            search: '搜索',
            more: '更多',
            resubscribe: '重新订阅',
            delete: '删除',
        },
        confirm: {
            resubscribe: '确认重新订阅这条记录？',
            delete: '确认删除这条订阅历史？',
        },
    },
} as const;
