import {
    CloudDownloadOutlined,
    FolderOpenOutlined, HistoryOutlined, ScheduleOutlined,
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

export default [
    {
        title: '影片',
        path: '/video',
        icon: (<VideoCameraOutlined/>),
        element: (<Video/>),
    },
    {
        title: '文件',
        path: '/file',
        icon: (<FolderOpenOutlined />),
        element: (<File/>),
    },
    {
        title: '下载',
        path: '/download',
        icon: (<CloudDownloadOutlined />),
        element: (<Download/>),
    },
    {
        title: '历史',
        path: '/history',
        icon: (<HistoryOutlined />),
        element: (<History />),
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
                icon: (<ScheduleOutlined />),
                element: (<Schedule/>),
                group: '系统'
            },
        ]
    }
]
