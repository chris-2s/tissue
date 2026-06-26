import {AppstoreOutlined, CloudDownloadOutlined, CloudOutlined, FolderOpenOutlined, GlobalOutlined, NotificationOutlined} from "@ant-design/icons";
import {Card, Tabs} from "antd";
import React from "react";
import {createFileRoute, Outlet, useLocation, useNavigate} from "@tanstack/react-router";

export const Route = createFileRoute('/_index/setting')({
    component: Setting
})

function Setting() {

    const navigate = useNavigate()
    const selected = useLocation().pathname

    const items = [
        {
            key: '/setting/library',
            label: '媒体库',
            icon: <AppstoreOutlined/>,
        },
        {
            key: '/setting/crawler',
            label: '爬虫',
            icon: <GlobalOutlined/>,
        },
        {
            key: '/setting/file',
            label: '文件',
            icon: <FolderOpenOutlined/>,
        },
        {
            key: '/setting/download',
            label: '下载',
            icon: <CloudDownloadOutlined/>,
        },
        {
            key: '/setting/notify',
            label: '通知',
            icon: <NotificationOutlined/>,
        },
        {
            key: '/setting/cookiecloud',
            label: 'CookieCloud',
            icon: <CloudOutlined/>,
        },
    ]


    return (
        <Card>
            <Tabs
                activeKey={selected}
                items={items}
                onChange={key => navigate({to: key})}
            />
            <Outlet/>
        </Card>
    )
}
