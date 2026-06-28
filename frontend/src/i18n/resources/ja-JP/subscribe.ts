export default {
    pageTitle: '購読',
    deleteSuccess: '削除成功',
    errors: {
        loadTitle: '購読一覧の読込失敗',
        loadDescription: '通信を確認して再試行してください',
    },
    empty: {
        title: '購読なし',
    },
    flags: {
        hd: '高清',
        zh: '中字',
        uncensored: '無碼',
    },
    filter: {
        searchPlaceholder: '番号、俳優、または題名を入力して Enter',
        currentFilters: '現在条件',
        clearFilters: '条件クリア',
        token: {
            num: '番号',
            actor: '俳優',
            title: '題名',
        },
    },
    modal: {
        createTitle: '購読追加',
        editTitle: '購読編集',
        emptyValue: 'なし',
        numRequired: '番号を入力してください',
        deleteConfirm: '削除しますか',
        regexTooltip: '正規表現対応',
        fields: {
            num: '番号',
            premiered: '発売日',
            title: '題名',
            actors: '俳優',
            includeKeyword: '含む語',
            excludeKeyword: '除外語',
            hd: '高清',
            zh: '中字',
            uncensored: '無碼',
        },
    },
    history: {
        title: '購読履歴',
        total: '計 {{count}} 件',
        empty: '購読履歴なし',
        noActors: '俳優情報なし',
        resubscribeSuccess: '再購読成功',
        deleteSuccess: '購読履歴削除成功',
        actions: {
            search: '検索',
            more: 'その他',
            resubscribe: '再購読',
            delete: '削除',
        },
        confirm: {
            resubscribe: 'この記録を再購読しますか？',
            delete: 'この購読履歴を削除しますか？',
        },
    },
} as const;
