export default {
    info: {
        title: '用户信息',
    },
    list: {
        title: '用户管理',
    },
    apiKey: {
        title: 'API Key 管理',
        keyLabel: 'Key',
        createDialogTitle: '新建 API Key',
        renameDialogTitle: '重命名 API Key',
        createdDialogTitle: 'API Key 已创建',
        createdDialogDescription: '完整 Key 仅展示一次，请立即保存：',
        createdDialogConfirm: '我已保存',
        createPlaceholder: '例如：Jellyfin 同步脚本',
        deleteConfirmTitle: '是否确认删除该 API Key',
    },
    modal: {
        createUserTitle: '新建用户',
        editUserTitle: '编辑用户',
    },
    fields: {
        name: '名称',
        username: '用户名',
        password: '新密码',
        confirmPassword: '确认新密码',
        admin: '管理员',
        status: '状态',
        createdAt: '创建时间',
    },
    status: {
        yes: '是',
        no: '否',
        enabled: '启用',
        disabled: '禁用',
    },
    actions: {
        rename: '重命名',
        createApiKey: '创建 API Key',
        copy: '复制',
    },
    validation: {
        nameRequired: '请输入名称',
        usernameRequired: '请输入用户名',
        passwordMismatch: '两次输入密码不一致',
    },
    feedback: {
        created: '创建成功',
        saved: '保存成功',
        deleted: '删除成功',
        copied: '已复制',
    },
} as const;
