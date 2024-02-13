import {Card, Tabs} from "antd";
import SettingApp from "./app";
import React from "react";
import {AppstoreOutlined, CloudDownloadOutlined, FolderOpenOutlined} from "@ant-design/icons";
import {useRequest} from "ahooks";
import * as api from "../../apis/setting";
import SettingDownload from "./download";
import SettingFile from "./file";


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
