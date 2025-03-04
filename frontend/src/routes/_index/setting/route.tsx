import {Card, Tabs} from "antd";
import React from "react";
import {AppstoreOutlined, CloudDownloadOutlined, FolderOpenOutlined, NotificationOutlined} from "@ant-design/icons";
import {createFileRoute, Outlet, useLocation, useNavigate} from "@tanstack/react-router";

export const Route = createFileRoute('/_index/setting')({
    component: Setting
})

function Setting() {

    const navigate = useNavigate()
    const selected = useLocation().pathname

    const items = [
        {
            key: '/setting/app',
            label: '通用',
            icon: <AppstoreOutlined/>,
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

