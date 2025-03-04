import {Button, Card, message, Table, Tag} from "antd";
import {ColumnsType} from "antd/lib/table";
import dayjs from "dayjs";
import * as api from "../../../apis/schedule";
import {useRequest} from "ahooks";
import React from "react";
import {createFileRoute} from "@tanstack/react-router";

export const Route = createFileRoute('/_index/schedule/')({
    component: Schedule,
})

function Schedule() {

    const {data = [], loading, refresh} = useRequest(api.getSchedules, {})
    const {run: onFire, loading: onFiring} = useRequest(api.fireSchedule, {
        manual: true,
        onSuccess: () => {
            message.success('手动执行成功')
            refresh()
        }
    })

    const columns: ColumnsType<any> = [
        {
            title: '任务',
            dataIndex: 'name'
        },
        {
            title: '状态',
            dataIndex: 'status',
            render: (value) => (
                value ? (<Tag color={"success"}>运行中</Tag>) : (<Tag color={'warning'}>等待</Tag>)
            )
        },
        {
            title: '下次执行',
            dataIndex: 'next_run_time',
            render: (value) => dayjs(value).format('lll')
        },
        {
            title: '操作',
            dataIndex: 'operations',
            render: (_, record: any) => (
                <span>
                    <Button type={'primary'} onClick={() => onFire(record.key)} loading={onFiring}>手动执行</Button>
                </span>
            )
        }
    ]

    return (
        <Card title={'任务列表'}>
            <Table rowKey={'key'} columns={columns} dataSource={data} loading={loading}/>
        </Card>
    )
}

