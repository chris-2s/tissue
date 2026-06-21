import {Form, Input, Modal, ModalProps, Select, Switch, Table, Tag, Tooltip} from "antd";
import React, {useEffect, useState} from "react";
import {useRequest} from "ahooks";
import * as api from "../../../../apis/file";
import * as videoApi from "../../../../apis/video.ts";
import {ColumnsType} from "antd/lib/table";
import {CheckCircleOutlined, CloseCircleOutlined, SyncOutlined} from "@ant-design/icons";
import {ManualTransModeOptions} from "../../../../utils/constants.ts";


interface Props extends ModalProps {
    files?: string[]
}

function BatchModal(props: Props) {

    const {files, ...otherProps} = props
    const [data, setData] = useState<any[]>([])
    const [transMode, setTransMode] = useState<string>('system')

    useEffect(() => {
        if (props.open && files) {
            setTransMode('system')
            run(files)
        }
    }, [props.open, files]);

    const {run, loading} = useRequest(api.batchParseFiles, {
        manual: true,
        onSuccess: (res) => {
            setData(res.data.data)
        }
    })

    function renderStatus(status: number) {
        if (status === 1) {
            return (
                <Tag icon={<SyncOutlined spin/>} color="processing"/>
            )
        } else if (status === 2) {
            return (
                <Tag icon={<CheckCircleOutlined/>} color="success"/>
            )
        } else if (status === 3) {
            return (
                <Tag icon={<CloseCircleOutlined/>} color="error"/>
            )
        }
    }

    const {run: onSave, loading: onSaving} = useRequest(async () => {
        for (const item of data) {
            await onSaveSingle(item)
        }
    }, {
        manual: true
    })

    async function onSaveSingle(video: any) {
        video.processStatus = 1
        setData([...data])
        try {
            const response = await videoApi.scrapeVideo(video.num)
            delete response.data.data.is_zh
            delete response.data.data.is_uncensored
            delete response.data.data.path
            const item = {...video, ...response.data.data}
            await videoApi.saveVideo(item, 'file', transMode === 'system' ? undefined : transMode)
            video.processStatus = 2
        } catch {
            video.processStatus = 3
        } finally {
            setData([...data])
        }
    }

    const columns: ColumnsType = [
        {
            title: "文件名",
            dataIndex: "path",
            render: (path, record) => (
                <div>
                    {renderStatus(record.processStatus)}
                    <Tooltip title={path}>{path.split("/").pop()}</Tooltip>
                </div>
            )
        },
        {
            title: "番号",
            dataIndex: "num",
            width: 150,
            render: (num, _, index) => (
                <Input value={num} variant={'filled'} onChange={value => {
                    data[index].num = value.target.value
                    setData([...data])
                }}/>
            )
        },
        {
            title: "中文",
            dataIndex: "is_zh",
            width: 75,
            render: (zh, _, index) => (
                <Switch checked={zh} onChange={(checked) => {
                    data[index].is_zh = checked
                    setData([...data])
                }}/>
            )
        },
        {
            title: "无码",
            dataIndex: "is_uncensored",
            width: 75,
            render: (uncensored, _, index) => (
                <Switch checked={uncensored} onChange={(checked) => {
                    data[index].is_uncensored = checked
                    setData([...data])
                }}/>
            )
        },
    ]

    return (
        <Modal title={'选中文件'} width={800} onOk={onSave} confirmLoading={onSaving} {...otherProps}>
            <Form layout={'vertical'}>
                <Form.Item label={'转移模式'} tooltip={'默认按系统设置处理，也可仅本次批量整理手动指定'}>
                    <Select value={transMode} className={'w-52'} onChange={setTransMode}
                            placeholder={'转移模式'}>
                        {ManualTransModeOptions.map(i => (
                            <Select.Option key={i.value} value={i.value}>{i.name}</Select.Option>
                        ))}
                    </Select>
                </Form.Item>
            </Form>
            <Table rowKey={'path'} size={'small'} columns={columns} dataSource={data} pagination={false}
                   loading={loading} scroll={{x: 'max-content'}}/>
        </Modal>
    )
}

export default BatchModal
