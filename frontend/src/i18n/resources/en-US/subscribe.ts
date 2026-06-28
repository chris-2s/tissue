export default {
    pageTitle: 'Subscriptions',
    deleteSuccess: 'Deleted successfully',
    errors: {
        loadTitle: 'Failed to load subscriptions',
        loadDescription: 'Check the network and try again',
    },
    empty: {
        title: 'No subscriptions',
    },
    flags: {
        hd: 'HD',
        zh: 'Chinese',
        uncensored: 'Uncensored',
    },
    filter: {
        searchPlaceholder: 'Search code or actor, or press Enter after typing a title',
        currentFilters: 'Current filters',
        clearFilters: 'Clear filters',
        token: {
            num: 'Code',
            actor: 'Actor',
            title: 'Title',
        },
    },
    modal: {
        createTitle: 'Create Subscription',
        editTitle: 'Edit Subscription',
        emptyValue: 'None',
        numRequired: 'Please enter the code',
        deleteConfirm: 'Delete this subscription?',
        regexTooltip: 'Regular expressions supported',
        fields: {
            num: 'Code',
            premiered: 'Release Date',
            title: 'Title',
            actors: 'Actors',
            includeKeyword: 'Include Keywords',
            excludeKeyword: 'Exclude Keywords',
            hd: 'HD',
            zh: 'Chinese',
            uncensored: 'Uncensored',
        },
    },
    history: {
        title: 'Subscription History',
        total: '{{count}} total',
        empty: 'No subscription history',
        noActors: 'No actor information',
        resubscribeSuccess: 'Resubscribed successfully',
        deleteSuccess: 'Subscription history deleted successfully',
        actions: {
            search: 'Search',
            more: 'More',
            resubscribe: 'Resubscribe',
            delete: 'Delete',
        },
        confirm: {
            resubscribe: 'Resubscribe this record?',
            delete: 'Delete this subscription history record?',
        },
    },
} as const;
