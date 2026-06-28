export default {
    info: {
        title: '用戶資訊',
    },
    list: {
        title: '用戶管理',
    },
    apiKey: {
        title: 'API Key 管理',
        keyLabel: 'Key',
        createDialogTitle: '新建 API Key',
        renameDialogTitle: '重新命名 API Key',
        createdDialogTitle: 'API Key 已建立',
        createdDialogDescription: '完整 Key 僅展示一次，請立即保存：',
        createdDialogConfirm: '我已保存',
        createPlaceholder: '例如：Jellyfin 同步腳本',
        deleteConfirmTitle: '是否確認刪除該 API Key',
    },
    modal: {
        createUserTitle: '新建用戶',
        editUserTitle: '編輯用戶',
    },
    fields: {
        name: '名稱',
        username: '帳號',
        password: '新密碼',
        confirmPassword: '確認新密碼',
        admin: '管理員',
        status: '狀態',
        createdAt: '建立時間',
    },
    status: {
        yes: '是',
        no: '否',
        enabled: '啟用',
        disabled: '停用',
    },
    actions: {
        rename: '重新命名',
        createApiKey: '建立 API Key',
        copy: '複製',
    },
    validation: {
        nameRequired: '請輸入名稱',
        usernameRequired: '請輸入帳號',
        passwordMismatch: '兩次輸入密碼不一致',
    },
    feedback: {
        created: '建立成功',
        saved: '保存成功',
        deleted: '刪除成功',
        copied: '已複製',
    },
} as const;
