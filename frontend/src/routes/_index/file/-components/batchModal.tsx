import {Form, Input, Modal, ModalProps, Select, Switch, Table, Tag, Tooltip} from "antd";
import React, {useEffect, useState} from "react";
import {useRequest} from "ahooks";
import * as api from "../../../../apis/file";
import * as videoApi from "../../../../apis/video.ts";
import {ColumnsType} from "antd/lib/table";
import {CheckCircleOutlined, CloseCircleOutlined, SyncOutlined} from "@ant-design/icons";
import {ManualTransModeOptions} from "../../../../utils/constants.ts";
import {useTranslation} from "react-i18next";


interface Props extends ModalProps {
    files?: string[]
}

function BatchModal(props: Props) {
    const {t} = useTranslation(['file', 'setting'])
    const {files, ...otherProps} = props
    const [data, setData] = useState<any[]>([])
    const [transMode, setTransMode] = useState<string>('system')

    const {run, loading} = useRequest(api.batchParseFiles, {
        manual: true,
        onSuccess: (res) => {
            setData(res.data.data)
        }
    })

    useEffect(() => {
        if (props.open && files) {
            setTransMode('system')
            run(files)
        }
    }, [files, props.open, run]);

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
            title: t('file:batch.columns.filename'),
            dataIndex: "path",
            render: (path, record) => (
                <div>
                    {renderStatus(record.processStatus)}
                    <Tooltip title={path}>{path.split("/").pop()}</Tooltip>
                </div>
            )
        },
        {
            title: t('file:batch.columns.num'),
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
            title: t('file:batch.columns.zh'),
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
            title: t('file:batch.columns.uncensored'),
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
        <Modal title={t('file:batch.modalTitle')} width={800} onOk={onSave} confirmLoading={onSaving} {...otherProps}>
            <Form layout={'vertical'}>
                <Form.Item label={t('file:batch.transMode')} tooltip={t('file:batch.transModeTooltip')}>
                    <Select value={transMode} className={'w-52'} onChange={setTransMode}
                            placeholder={t('file:batch.transMode')}>
                        {ManualTransModeOptions.map(i => (
                            <Select.Option key={i.value} value={i.value}>
                                {i.value === 'system' ? t('file:batch.transModeOptions.system') : t(`setting:transMode.${i.value}`)}
                            </Select.Option>
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
