export default {
    errors: {
        loadTitle: '搜索失败',
        loadDescription: '请检查网络或关键词后重试。',
    },
    empty: {
        idle: '输入关键词后可选择搜索影片或演员',
        results: '暂无搜索结果',
        history: '暂无历史记录',
    },
    panel: {
        placeholder: '搜索电影、剧集以及更多...',
        recent: '最近搜索',
        clearHistory: '清空历史',
        chooseMode: '选择搜索方式',
        searchVideo: '搜索影片',
        searchActor: '搜索演员',
        searchVideoHint: '搜索 {{keyword}} 相关的影片结果',
        searchActorHint: '搜索 {{keyword}} 相关的演员结果',
    },
    actorResults: {
        count: '{{count}} 条结果',
        aliasLabel: '别名',
        noAlias: '暂无别名',
    },
    card: {
        scoreUnit: '分',
        ratedBy: '由{{count}}人评价',
        zhRibbon: '中文',
    },
} as const;
