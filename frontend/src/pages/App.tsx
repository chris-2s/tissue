import React from 'react';
import './App.css';
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
require('dayjs/locale/zh-cn')

dayjs.extend(relativeTime)
dayjs.extend(localizedFormat)
dayjs.locale('zh-cn')

function App() {

    const currentTheme = useSelector((state: RootState) => state.app.theme)

    return (
        <ConfigProvider
            locale={zhCN}
            theme={{
                algorithm: themes.find(i => i.name === currentTheme)?.algorithm,
            }}>
            <div className="App">
                <RouterProvider router={routes}/>
            </div>
        </ConfigProvider>
    );
}

export default App;
