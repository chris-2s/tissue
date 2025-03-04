import React from 'react';
import zhCN from "antd/lib/locale/zh_CN";
import dayjs from "dayjs";
import localizedFormat from 'dayjs/plugin/localizedFormat';
import relativeTime from "dayjs/plugin/relativeTime";
import 'dayjs/locale/zh-cn'
import {useTheme} from "ahooks";
import {useSelector} from "react-redux";

import {ConfigProvider, theme} from "antd";
import {RootState} from "../models";
import {createRootRouteWithContext, Outlet} from "@tanstack/react-router";


dayjs.extend(relativeTime)
dayjs.extend(localizedFormat)
dayjs.locale('zh-cn')

interface MyRouteContext {
    userToken?: string
}

export const Route = createRootRouteWithContext<MyRouteContext>()({
    component: App
})

function App() {

    const themeMode = useSelector((state: RootState) => state.app?.themeMode)
    const {theme: systemTheme} = useTheme()

    const handleThemeChange = () => {
        switch (themeMode) {
            case 'system':
                return systemTheme === 'light' ? theme.defaultAlgorithm : theme.darkAlgorithm
            case 'dark':
                return theme.darkAlgorithm
            case 'light':
                return theme.defaultAlgorithm
        }
    }

    return (
        <ConfigProvider
            locale={zhCN}
            theme={{
                algorithm: handleThemeChange(),
            }}>
            <Outlet/>
        </ConfigProvider>
    );
}
