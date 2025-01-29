import {
    CarryOutOutlined,
    CloudDownloadOutlined,
    FolderOpenOutlined, HistoryOutlined, HomeOutlined, MenuOutlined, ScheduleOutlined, SearchOutlined,
    SettingOutlined,
    UserOutlined,
    VideoCameraOutlined
} from "@ant-design/icons";

import React from "react";
import User from "../pages/user";
import Setting from "../pages/setting";
import Video from "../pages/video";
import File from "../pages/file";
import Download from "../pages/download";
import History from "../pages/history";
import Schedule from "../pages/schedule";
import Home from "../pages/home";
import Subscribe from "../pages/subscribe";
import Search from "../pages/search";
import Menu from "../pages/index/menu.tsx";

export default [
    {
        title: '首页',
        path: '/',
        icon: (<HomeOutlined/>),
        element: (<Home/>),
    },
    {
        title: '菜单',
        path: '/menu',
        icon: (<MenuOutlined/>),
        element: (<Menu/>),
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
                element: (<Video/>),
            },
            {
                title: '文件',
                path: '/file',
                icon: (<FolderOpenOutlined/>),
                element: (<File/>),
            },
            {
                title: '下载',
                path: '/download',
                icon: (<CloudDownloadOutlined/>),
                element: (<Download/>),
            },
            {
                title: '历史',
                path: '/history',
                icon: (<HistoryOutlined/>),
                element: (<History/>),
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
                element: (<Subscribe/>),
            },
            {
                title: '搜索',
                path: '/search',
                icon: (<SearchOutlined/>),
                element: (<Search/>),
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
                element: (<User/>),
                group: '系统'
            },
            {
                title: '设置',
                path: '/setting',
                icon: (<SettingOutlined/>),
                element: (<Setting/>),
                group: '系统'
            },
            {
                title: '任务',
                path: '/schedule',
                icon: (<ScheduleOutlined/>),
                element: (<Schedule/>),
                group: '系统'
            },
        ]
    }
]
