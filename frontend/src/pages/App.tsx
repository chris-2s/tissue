import React from 'react';
import {RouterProvider} from "react-router-dom";
import zhCN from "antd/lib/locale/zh_CN";
import dayjs from "dayjs";


import routes from "../routes";
import {ConfigProvider, theme} from "antd";
import {useSelector} from "react-redux";
import {RootState} from "../models";
import {themes} from "../utils/constants";


import localizedFormat from 'dayjs/plugin/localizedFormat';
import relativeTime from "dayjs/plugin/relativeTime";
import 'dayjs/locale/zh-cn'
import {useTheme} from "ahooks";

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
            <div className="h-full">
                <RouterProvider router={routes}/>
            </div>
        </ConfigProvider>
    );
}

export default App;
