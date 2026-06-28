export default {
    errors: {
        loadTitle: 'Search failed',
        loadDescription: 'Check the network or keyword and try again.',
    },
    empty: {
        idle: 'Enter a keyword to search videos or actors',
        results: 'No search results',
        history: 'No search history',
    },
    panel: {
        placeholder: 'Search movies, series, and more...',
        recent: 'Recent Searches',
        clearHistory: 'Clear History',
        chooseMode: 'Choose Search Mode',
        searchVideo: 'Search Videos',
        searchActor: 'Search Actors',
        searchVideoHint: 'Search video results related to {{keyword}}',
        searchActorHint: 'Search actor results related to {{keyword}}',
    },
    actorResults: {
        count: '{{count}} results',
        aliasLabel: 'Aliases',
        noAlias: 'No aliases',
    },
    card: {
        scoreUnit: '',
        ratedBy: '{{count}} ratings',
        zhRibbon: 'Chinese',
    },
} as const;
