export default {
    pageTitle: '任務列表',
    fireSuccess: '手動執行成功',
    errors: {
        loadTitle: '任務列表加載失敗',
        loadDescription: '請檢查網路後重試',
    },
    empty: {
        title: '暫無任務',
    },
    fields: {
        status: '狀態',
        nextRunTime: '下次執行',
    },
    status: {
        running: '執行中',
        waiting: '等待',
    },
    actions: {
        fire: '手動執行',
    },
} as const;
