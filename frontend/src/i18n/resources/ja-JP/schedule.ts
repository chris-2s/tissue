export default {
    pageTitle: 'タスク一覧',
    fireSuccess: '手動実行成功',
    errors: {
        loadTitle: 'タスク一覧の読込失敗',
        loadDescription: '通信を確認して再試行してください',
    },
    empty: {
        title: 'タスクなし',
    },
    fields: {
        status: '状態',
        nextRunTime: '次回実行',
    },
    status: {
        running: '実行中',
        waiting: '待機',
    },
    actions: {
        fire: '手動実行',
    },
} as const;
