import React from 'react';
import {useTheme} from "ahooks";
import {useSelector} from "react-redux";

import {ConfigProvider, theme} from "antd";
import {StyleProvider} from '@ant-design/cssinjs';
import type {QueryClient} from "@tanstack/react-query";
import {useTranslation} from "react-i18next";
import {getAntdLocale} from "../i18n/third-party/antd";
import {syncDayjsLocale} from "../i18n/third-party/dayjs";
import {DEFAULT_LOCALE, normalizeLocale} from "../i18n/locale";
import {RootState} from "../models";
import {createRootRouteWithContext, Outlet} from "@tanstack/react-router";

interface MyRouteContext {
    userToken?: string
    queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouteContext>()({
    component: App
})

function App() {

    const {i18n} = useTranslation()
    const {themeMode} = useSelector((state: RootState) => state.app)
    const {theme: systemTheme} = useTheme()
    const locale = normalizeLocale(i18n.resolvedLanguage ?? DEFAULT_LOCALE)
    const antdLocale = getAntdLocale(locale)

    React.useEffect(() => {
        syncDayjsLocale(locale)
    }, [locale])

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
        <StyleProvider layer>
            <ConfigProvider
                locale={antdLocale}
                theme={{
                    algorithm: handleThemeChange(),
                }}>
                <Outlet/>
            </ConfigProvider>
        </StyleProvider>
    );
}
