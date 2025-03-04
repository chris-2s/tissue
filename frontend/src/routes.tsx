import {
    CarryOutOutlined,
    CloudDownloadOutlined,
    FolderOpenOutlined,
    HistoryOutlined,
    HomeOutlined,
    InfoCircleOutlined,
    MenuOutlined,
    ScheduleOutlined,
    SearchOutlined,
    SettingOutlined,
    UserOutlined,
    VideoCameraOutlined
} from "@ant-design/icons";
import {createRouter} from "@tanstack/react-router";
import {routeTree} from "./routeTree.gen.ts";

export const router = createRouter({
    routeTree,
    scrollRestoration: true
})

declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router
    }
}

export default [
    {
        title: '首页',
        path: '/home',
        icon: (<HomeOutlined/>),
    },
    {
        title: '菜单',
        path: '/menu',
        icon: (<MenuOutlined/>),
        hidden: true,
    },
    {
        title: '整理',
        type: 'group',
        children: [
            {
                title: '影片',
                path: '/video',
                icon: (<VideoCameraOutlined/>),
            },
            {
                title: '文件',
                path: '/file',
                icon: (<FolderOpenOutlined/>),
            },
            {
                title: '下载',
                path: '/download',
                icon: (<CloudDownloadOutlined/>),
            },
            {
                title: '历史',
                path: '/history',
                icon: (<HistoryOutlined/>),
            },
        ]
    },
    {
        title: '订阅',
        type: 'group',
        children: [
            {
                title: '订阅',
                path: '/subscribe',
                icon: (<CarryOutOutlined/>),
            },
            {
                title: '搜索',
                path: '/search',
                icon: (<SearchOutlined/>),
            },
        ]
    },
    {
        title: '设置',
        type: 'group',
        children: [
            {
                title: '用户',
                path: '/user',
                icon: (<UserOutlined/>),
                group: '系统'
            },
            {
                title: '设置',
                path: '/setting',
                icon: (<SettingOutlined/>),
                group: '系统'
            },
            {
                title: '任务',
                path: '/schedule',
                icon: (<ScheduleOutlined/>),
                group: '系统'
            },
            {
                title: '关于',
                path: '/about',
                icon: (<InfoCircleOutlined/>),
                group: '系统'
            },
        ]
    }
]
