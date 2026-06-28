import {AppstoreOutlined, CloudDownloadOutlined, CloudOutlined, FolderOpenOutlined, GlobalOutlined, NotificationOutlined} from "@ant-design/icons";
import {Card, Tabs} from "antd";
import React from "react";
import {createFileRoute, Outlet, useLocation, useNavigate} from "@tanstack/react-router";
import {useTranslation} from "react-i18next";

export const Route = createFileRoute('/_index/setting')({
    component: Setting
})

function Setting() {

    const {t} = useTranslation(['setting'])
    const navigate = useNavigate()
    const selected = useLocation().pathname

    const items = [
        {
            key: '/setting/library',
            label: t('setting:tabs.library'),
            icon: <AppstoreOutlined/>,
        },
        {
            key: '/setting/crawler',
            label: t('setting:tabs.crawler'),
            icon: <GlobalOutlined/>,
        },
        {
            key: '/setting/file',
            label: t('setting:tabs.file'),
            icon: <FolderOpenOutlined/>,
        },
        {
            key: '/setting/download',
            label: t('setting:tabs.download'),
            icon: <CloudDownloadOutlined/>,
        },
        {
            key: '/setting/notify',
            label: t('setting:tabs.notify'),
            icon: <NotificationOutlined/>,
        },
        {
            key: '/setting/cookiecloud',
            label: t('setting:tabs.cookiecloud'),
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
