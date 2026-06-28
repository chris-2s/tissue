export default {
    info: {
        title: 'ユーザー情報',
    },
    list: {
        title: 'ユーザー管理',
    },
    apiKey: {
        title: 'API Key 管理',
        keyLabel: 'Key',
        createDialogTitle: 'API Key 新規作成',
        renameDialogTitle: 'API Key 名変更',
        createdDialogTitle: 'API Key を作成しました',
        createdDialogDescription: '完全な Key は一度だけ表示されます。すぐ保存してください：',
        createdDialogConfirm: '保存しました',
        createPlaceholder: '例：Jellyfin 同期スクリプト',
        deleteConfirmTitle: 'この API Key を削除しますか',
    },
    modal: {
        createUserTitle: 'ユーザー新規作成',
        editUserTitle: 'ユーザー編集',
    },
    fields: {
        name: '名称',
        username: 'ユーザー名',
        password: '新パスワード',
        confirmPassword: '新パスワード確認',
        admin: '管理者',
        status: '状態',
        createdAt: '作成日時',
    },
    status: {
        yes: 'はい',
        no: 'いいえ',
        enabled: '有効',
        disabled: '無効',
    },
    actions: {
        rename: '名称変更',
        createApiKey: 'API Key 作成',
        copy: 'コピー',
    },
    validation: {
        nameRequired: '名称を入力してください',
        usernameRequired: 'ユーザー名を入力してください',
        passwordMismatch: '2回のパスワード入力が不一致です',
    },
    feedback: {
        created: '作成成功',
        saved: '保存成功',
        deleted: '削除成功',
        copied: 'コピー済み',
    },
} as const;
