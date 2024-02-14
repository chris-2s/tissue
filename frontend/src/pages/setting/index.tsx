import {Card, Tabs} from "antd";
import SettingApp from "./app";
import React from "react";
import {AppstoreOutlined, CloudDownloadOutlined, FolderOpenOutlined, NotificationOutlined} from "@ant-design/icons";
import {useRequest} from "ahooks";
import * as api from "../../apis/setting";
import SettingDownload from "./download";
import SettingFile from "./file";
import SettingNotify from "./notify";


function Setting() {

    const defaultKey = window.location.hash?.substring(1) || 'app'
    const {data = {}, loading} = useRequest(api.getSettings, {})

    const items = [
        {
            key: 'app',
            label: '通用',
            children: <SettingApp data={data.app}/>,
            icon: <AppstoreOutlined/>,
        },
        {
            key: 'file',
            label: '文件',
            children: <SettingFile data={data.file}/>,
            icon: <FolderOpenOutlined/>,
        },
        {
            key: 'download',
            label: '下载',
            children: <SettingDownload data={data.download}/>,
            icon: <CloudDownloadOutlined/>,
        },
        {
            key: 'notify',
            label: '通知',
            children: <SettingNotify data={data.notify}/>,
            icon: <NotificationOutlined />,
        },
    ]


    return (
        <Card loading={loading}>
            <Tabs
                defaultActiveKey={defaultKey}
                items={items}
            />
        </Card>
    )
}

export default Setting
