export default {
    actions: {
        add: 'Add',
        cancel: 'Cancel',
        clear: 'Clear',
        close: 'Close',
        confirm: 'Confirm',
        delete: 'Delete',
        edit: 'Edit',
        refresh: 'Refresh',
        retry: 'Retry',
        save: 'Save',
        search: 'Search',
        submit: 'Submit',
    },
    theme: {
        system: 'System',
        light: 'Light',
        dark: 'Dark',
    },
    feedback: {
        settingsSaved: 'Settings saved',
    },
    pin: {
        incorrect: 'Incorrect PIN',
        mismatch: 'The two PIN entries do not match',
        setSuccess: 'PIN set successfully',
        cleared: 'PIN cleared successfully',
        enter: 'Enter PIN',
        repeat: 'Enter PIN again',
        clear: 'Clear PIN',
        warning: 'Reliability cannot be guaranteed due to system and compatibility limitations',
    },
    pullToRefresh: {
        pulling: 'Pull to refresh',
        release: 'Release to refresh',
        refreshing: 'Refreshing...',
    },
    state: {
        empty: 'No data',
        loading: 'Loading',
        noImage: 'No image',
    },
} as const;
