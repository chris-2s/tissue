export default {
    actions: {
        add: '新增',
        cancel: '取消',
        clear: '清空',
        close: '关闭',
        confirm: '确认',
        delete: '删除',
        edit: '编辑',
        refresh: '刷新',
        retry: '重试',
        save: '保存',
        search: '搜索',
        submit: '提交',
    },
    theme: {
        system: '跟随系统',
        light: '明亮',
        dark: '暗黑',
    },
    feedback: {
        settingsSaved: '设置成功',
    },
    pin: {
        incorrect: '密码错误',
        mismatch: '两次输入密码不匹配',
        setSuccess: '密码设置成功',
        cleared: '密码取消成功',
        enter: '请输入密码',
        repeat: '请再次输入密码',
        clear: '清空密码',
        warning: '由于系统及兼容性限制，可靠性无法保证',
    },
    pullToRefresh: {
        pulling: '下拉刷新',
        release: '松开刷新',
        refreshing: '刷新中...',
    },
    state: {
        empty: '暂无数据',
        loading: '加载中',
        noImage: '暂无图片',
    },
} as const;
