export default {
    pageTitle: '任务列表',
    fireSuccess: '手动执行成功',
    errors: {
        loadTitle: '任务列表加载失败',
        loadDescription: '请检查网络后重试',
    },
    empty: {
        title: '暂无任务',
    },
    fields: {
        status: '状态',
        nextRunTime: '下次执行',
    },
    status: {
        running: '运行中',
        waiting: '等待',
    },
    actions: {
        fire: '手动执行',
    },
} as const;
