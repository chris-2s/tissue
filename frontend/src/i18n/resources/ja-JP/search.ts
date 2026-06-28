export default {
    errors: {
        loadTitle: '検索失敗',
        loadDescription: '通信またはキーワードを確認して再試行してください。',
    },
    empty: {
        idle: 'キーワード入力後、作品または俳優を検索できます',
        results: '検索結果なし',
        history: '履歴なし',
    },
    panel: {
        placeholder: '映画、ドラマなどを検索...',
        recent: '最近検索',
        clearHistory: '履歴クリア',
        chooseMode: '検索方式',
        searchVideo: '作品検索',
        searchActor: '俳優検索',
        searchVideoHint: '{{keyword}} 関連の作品を検索',
        searchActorHint: '{{keyword}} 関連の俳優を検索',
    },
    actorResults: {
        count: '{{count}} 件',
        aliasLabel: '別名',
        noAlias: '別名なし',
    },
    card: {
        scoreUnit: '点',
        ratedBy: '{{count}}人評価',
        zhRibbon: '中字',
    },
} as const;
