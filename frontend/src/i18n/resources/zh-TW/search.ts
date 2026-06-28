export default {
    errors: {
        loadTitle: '搜尋失敗',
        loadDescription: '請檢查網路或關鍵字後重試。',
    },
    empty: {
        idle: '輸入關鍵字後可選擇搜尋影片或演員',
        results: '暫無搜尋結果',
        history: '暫無歷史記錄',
    },
    panel: {
        placeholder: '搜尋電影、劇集以及更多...',
        recent: '最近搜尋',
        clearHistory: '清空歷史',
        chooseMode: '選擇搜尋方式',
        searchVideo: '搜尋影片',
        searchActor: '搜尋演員',
        searchVideoHint: '搜尋 {{keyword}} 相關的影片結果',
        searchActorHint: '搜尋 {{keyword}} 相關的演員結果',
    },
    actorResults: {
        count: '{{count}} 筆結果',
        aliasLabel: '別名',
        noAlias: '暫無別名',
    },
    card: {
        scoreUnit: '分',
        ratedBy: '由{{count}}人評價',
        zhRibbon: '中文',
    },
} as const;
