import React from 'react';
import {RouterProvider} from "react-router-dom";
import zhCN from "antd/lib/locale/zh_CN";
import dayjs from "dayjs";
import localizedFormat from 'dayjs/plugin/localizedFormat';
import relativeTime from "dayjs/plugin/relativeTime";
import 'dayjs/locale/zh-cn'
import {useTheme} from "ahooks";
import {useSelector} from "react-redux";

import routes from "../routes";
import {ConfigProvider, theme} from "antd";
import {RootState} from "../models";


dayjs.extend(relativeTime)
dayjs.extend(localizedFormat)
dayjs.locale('zh-cn')

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
            <div>
                <RouterProvider router={routes}/>
            </div>
        </ConfigProvider>
    );
}

export default App;
