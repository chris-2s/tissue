export default {
    pageTitle: 'Files',
    batchTitle: 'Batch Organize',
    detailTitle: 'File Organize',
    searchPlaceholder: 'Search',
    organize: 'Organize',
    empty: {
        title: 'No files, ',
        configure: 'Configure files',
    },
    errors: {
        loadTitle: 'Failed to load files',
        loadDescription: 'Check the network and try again',
    },
    batch: {
        modalTitle: 'Selected Files',
        transMode: 'Transfer Mode',
        transModeTooltip: 'Use the system setting by default, or override it only for this batch run',
        transModeOptions: {
            system: 'Use System Setting',
        },
        columns: {
            filename: 'Filename',
            num: 'Code',
            zh: 'Chinese',
            uncensored: 'Uncensored',
        },
    },
} as const;
