export default {
    title: 'Logs',
    levels: {
        all: 'All',
        issue: 'Issues',
        info: 'Info',
        debug: 'Debug',
    },
    status: {
        connected: 'Connected',
        connecting: 'Connecting',
        closed: 'Closed',
        error: 'Connection error',
    },
    controls: {
        autoScroll: 'Auto scroll',
        clear: 'Clear view',
        searchPlaceholder: 'Search module or log content',
    },
    empty: {
        noLogs: 'No logs yet',
        noMatches: 'No matching logs',
    },
    errors: {
        connectFailed: 'Log connection failed: {{status}}',
    },
} as const;
