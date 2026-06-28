export default {
    pageTitle: 'ファイル一覧',
    batchTitle: '一括整理',
    detailTitle: 'ファイル整理',
    searchPlaceholder: '検索',
    organize: '整理',
    empty: {
        title: 'ファイルなし、',
        configure: 'ファイル設定',
    },
    errors: {
        loadTitle: 'ファイル一覧の読込失敗',
        loadDescription: '通信を確認して再試行してください',
    },
    batch: {
        modalTitle: '対象ファイル',
        transMode: '転送方式',
        transModeTooltip: '通常はシステム設定を使用し、今回だけ手動指定もできます',
        transModeOptions: {
            system: 'システム設定',
        },
        columns: {
            filename: 'ファイル名',
            num: '番号',
            zh: '中字',
            uncensored: '無碼',
        },
    },
} as const;
