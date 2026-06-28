export default {
    pageTitle: 'History',
    searchPlaceholder: 'Search',
    deleteSuccess: 'Deleted successfully',
    errors: {
        loadTitle: 'Failed to load history',
        loadDescription: 'Check the network and try again',
    },
    columns: {
        status: 'Status',
        num: 'Code',
        path: 'Path',
        transMethod: 'Transfer mode',
        time: 'Time',
    },
    status: {
        success: 'Success',
        failed: 'Failed',
    },
    flags: {
        zh: 'Subtitled',
        uncensored: 'Uncensored',
    },
    actions: {
        reprocess: 'Reprocess',
        deleteRecord: 'Delete record',
    },
    confirm: {
        deleteRecord: 'Delete this record?',
    },
    detailTitle: 'Reprocess',
    transMode: {
        copy: 'Copy',
        move: 'Move',
        hardlink: 'Hard link',
        symlink: 'Soft link',
    },
} as const;
