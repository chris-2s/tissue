export default {
    info: {
        title: 'User Info',
    },
    list: {
        title: 'User Management',
    },
    apiKey: {
        title: 'API Key Management',
        keyLabel: 'Key',
        createDialogTitle: 'Create API Key',
        renameDialogTitle: 'Rename API Key',
        createdDialogTitle: 'API Key Created',
        createdDialogDescription: 'The full key is shown only once. Save it now:',
        createdDialogConfirm: 'Saved',
        createPlaceholder: 'Example: Jellyfin sync script',
        deleteConfirmTitle: 'Delete this API Key?',
    },
    modal: {
        createUserTitle: 'Create User',
        editUserTitle: 'Edit User',
    },
    fields: {
        name: 'Name',
        username: 'Username',
        password: 'New Password',
        confirmPassword: 'Confirm New Password',
        admin: 'Admin',
        status: 'Status',
        createdAt: 'Created At',
    },
    status: {
        yes: 'Yes',
        no: 'No',
        enabled: 'Enabled',
        disabled: 'Disabled',
    },
    actions: {
        rename: 'Rename',
        createApiKey: 'Create API Key',
        copy: 'Copy',
    },
    validation: {
        nameRequired: 'Please enter a name',
        usernameRequired: 'Please enter a username',
        passwordMismatch: 'The two passwords do not match',
    },
    feedback: {
        created: 'Created successfully',
        saved: 'Saved successfully',
        deleted: 'Deleted successfully',
        copied: 'Copied',
    },
} as const;
