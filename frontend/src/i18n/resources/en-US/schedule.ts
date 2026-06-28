export default {
    pageTitle: 'Tasks',
    fireSuccess: 'Triggered successfully',
    errors: {
        loadTitle: 'Failed to load tasks',
        loadDescription: 'Check the network and try again',
    },
    empty: {
        title: 'No tasks',
    },
    fields: {
        status: 'Status',
        nextRunTime: 'Next Run',
    },
    status: {
        running: 'Running',
        waiting: 'Waiting',
    },
    actions: {
        fire: 'Run Now',
    },
} as const;
