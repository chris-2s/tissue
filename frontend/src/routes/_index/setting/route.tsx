import {AppstoreOutlined, CloudDownloadOutlined, CloudOutlined, FolderOpenOutlined, GlobalOutlined, NotificationOutlined, RobotOutlined} from "@ant-design/icons";
import {Card, Grid, Tabs} from "antd";
import React from "react";
import {createFileRoute, Outlet, useLocation, useNavigate} from "@tanstack/react-router";
import {useTranslation} from "react-i18next";

import SettingNav from "./-components/nav.tsx";

export const Route = createFileRoute('/_index/setting')({
    component: Setting
})

function Setting() {

    const {t} = useTranslation(['setting'])
    const navigate = useNavigate()
    const selected = useLocation().pathname
    const screens = Grid.useBreakpoint()
    const isDesktop = Boolean(screens.lg)
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
            key: '/setting/text-processing',
            label: t('setting:tabs.textProcessing'),
            icon: <RobotOutlined/>,
        },
        {
            key: '/setting/cookiecloud',
            label: t('setting:tabs.cookiecloud'),
            icon: <CloudOutlined/>,
        },
    ]
    return (
        <Card bodyStyle={isDesktop ? {padding: 0} : undefined}>
            {isDesktop ? (
                <div className={'flex min-h-[640px]'}>
                    <SettingNav items={items} onChange={key => navigate({to: key})} selected={selected}/>
                    <div className={'min-w-0 flex-1 p-6'}>
                        <Outlet/>
                    </div>
                </div>
            ) : (
                <>
                    <Tabs
                        activeKey={selected}
                        items={items}
                        onChange={key => navigate({to: key})}
                    />
                    <Outlet/>
                </>
            )}
        </Card>
    )
}
