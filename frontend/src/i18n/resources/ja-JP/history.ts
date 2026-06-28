export default {
    pageTitle: '履歴',
    searchPlaceholder: '検索',
    deleteSuccess: '削除成功',
    errors: {
        loadTitle: '履歴の読込失敗',
        loadDescription: '通信を確認して再試行してください',
    },
    columns: {
        status: '状態',
        num: '番号',
        path: 'パス',
        transMethod: '転送方式',
        time: '時間',
    },
    status: {
        success: '成功',
        failed: '失敗',
    },
    flags: {
        zh: '中字',
        uncensored: '無碼',
    },
    actions: {
        reprocess: '再整理',
        deleteRecord: '記録削除',
    },
    confirm: {
        deleteRecord: 'この記録を削除しますか',
    },
    detailTitle: '再整理',
    transMode: {
        copy: 'コピー',
        move: '移動',
        hardlink: 'ハードリンク',
        symlink: 'シンボリックリンク',
    },
} as const;
