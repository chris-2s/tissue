export default {
    title: '日志',
    levels: {
        all: '全部',
        issue: '问题',
        info: '信息',
        debug: '调试',
    },
    status: {
        connected: '已连接',
        connecting: '连接中',
        closed: '已关闭',
        error: '连接异常',
    },
    controls: {
        autoScroll: '自动滚动',
        clear: '清空视图',
        searchPlaceholder: '搜索模块或日志内容',
    },
    empty: {
        noLogs: '暂无日志',
        noMatches: '没有匹配的日志',
    },
    errors: {
        connectFailed: '日志连接失败: {{status}}',
    },
} as const;
