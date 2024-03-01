import React from 'react';
import {RouterProvider} from "react-router-dom";
import zhCN from "antd/lib/locale/zh_CN";
import dayjs from "dayjs";


import routes from "../routes";
import {ConfigProvider} from "antd";
import {useSelector} from "react-redux";
import {RootState} from "../models";
import {themes} from "../utils/constants";


import localizedFormat from 'dayjs/plugin/localizedFormat';
import relativeTime from "dayjs/plugin/relativeTime";
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.extend(localizedFormat)
dayjs.locale('zh-cn')

function App() {

    const currentTheme = useSelector((state: RootState) => state.app.theme)
    const algorithm = themes.find(i => i.name === currentTheme)?.algorithm

    return (
        <ConfigProvider
            locale={zhCN}
            theme={{
                algorithm: algorithm,
            }}>
            <div className="h-full">
                <RouterProvider router={routes}/>
            </div>
        </ConfigProvider>
    );
}

export default App;
