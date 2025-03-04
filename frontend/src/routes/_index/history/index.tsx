import {Card, Input, message, Modal, Table, Tag} from "antd";
import {ColumnsType} from "antd/lib/table";
import * as api from "../../../apis/history";
import {useDebounce, useRequest} from "ahooks";
import dayjs from "dayjs";
import React, {useMemo, useState} from "react";
import {DeleteOutlined, EditOutlined} from "@ant-design/icons";
import More from "../../../components/More";
import {createFileRoute} from "@tanstack/react-router";
import VideoDetail from "../../../components/VideoDetail";
import {TransModeOptions} from "../../../utils/constants.ts";

export const Route = createFileRoute('/_index/history/')({
    component: History,
})

function History() {

    const {data = [], loading, refresh} = useRequest(api.getHistories, {})
    const [selected, setSelected] = useState<any | undefined>()
    const [keyword, setKeyword] = useState<string>()
    const keywordDebounce = useDebounce(keyword, {wait: 1000})

    const realData = useMemo(() => {
        return data.filter((item: any) => {
            return !keywordDebounce ||
                item.num?.indexOf(keywordDebounce) > -1 ||
                item.source_path?.indexOf(keywordDebounce) > -1 ||
                item.dest_path?.indexOf(keywordDebounce) > -1
        })
    }, [data, keywordDebounce])

    const {run: onDelete} = useRequest(api.deleteHistory, {
        manual: true,
        onSuccess: () => {
            refresh()
            message.success("删除成功")
        }
    })

    const columns: ColumnsType<any> = [
        {
            title: '状态',
            dataIndex: 'status',
            render: (value) => (value ? (<Tag color={'success'}>成功</Tag>) : (<Tag color={'error'}>失败</Tag>))
        },
        {
            title: '番号',
            dataIndex: 'num',
            render: (value, record: any) => (
                <div>
                    <b>{value}</b>
                    <div>
                        {record.is_zh && (<Tag color={'blue'}>中文</Tag>)}
                        {record.is_uncensored && (<Tag color={'green'}>无码</Tag>)}
                    </div>
                </div>
            )
        },
        {
            title: '路径',
            dataIndex: 'path',
            render: (_, record: any) => (
                <div style={{fontSize: 6, maxWidth: 680}}>
                    <div>{record.source_path}</div>
                    <div>{'==>'}</div>
                    <div>{record.dest_path}</div>
                </div>
            )
        },
        {
            title: '转移方式',
            dataIndex: 'trans_method',
            render: (value: string) => {
                const method = TransModeOptions.find((i: any) => i.value === value)
                return (
                    <Tag color={method?.color}>{method?.name}</Tag>
                )
            }
        },
        {
            title: '时间',
            dataIndex: 'create_time',
            render: (value) => dayjs(value).format('lll')
        },
        {
            title: '',
            dataIndex: 'operations',
            width: 20,
            fixed: 'right',
            render: (_, record) => (
                !record.is_admin && (
                    <More items={items} onClick={(key) => onMoreClick(key, record)}/>
                )
            )
        }
    ]

    const items = [
        {
            key: 'edit',
            label: '重新整理',
            icon: <EditOutlined/>
        },
        {
            key: 'delete',
            label: '删除记录',
            icon: <DeleteOutlined/>
        },
    ] as any

    function onMoreClick(key: string, record: any) {
        if (key === 'edit') {
            setSelected(record)
        } else if (key === 'delete') {
            Modal.confirm({
                title: '是否确认删除记录',
                onOk: () => {
                    onDelete(record.id)
                }
            })
        }
    }

    return (
        <Card title={'历史记录'}
              extra={(<Input.Search value={keyword} onChange={e => setKeyword(e.target.value)} placeholder={'搜索'}/>)}>
            <Table rowKey={'id'} scroll={{x: 'max-content'}} columns={columns} loading={loading}
                   dataSource={realData}/>
            <VideoDetail title={'重新整理'}
                         mode={'history'}
                         transMode={selected?.status ? 'move' : selected?.trans_mode}
                         width={1100}
                         path={selected?.status ? selected?.dest_path : selected?.source_path}
                         open={!!selected}
                         onCancel={() => setSelected(undefined)}
                         onOk={() => {
                             setSelected(undefined)
                             refresh()
                         }}
            />
        </Card>
    )
}

