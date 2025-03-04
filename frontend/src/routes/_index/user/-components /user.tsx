import {Card, message, Table} from "antd";
import {ColumnsType} from "antd/lib/table";
import React from "react";
import {PlusOutlined} from "@ant-design/icons";
import UserModal from "./userModal.tsx";
import * as api from "../../../../apis/user";
import {useAntdTable} from "ahooks";
import More from "../../../../components/More";
import IconButton from "../../../../components/IconButton";
import {useFormModal} from "../../../../utils/useFormModal.ts";

function UserList() {
    const {tableProps, refresh} = useAntdTable(api.getUsers)
    const {setOpen, modalProps} = useFormModal({
        service: api.modifyUser,
        onOk: () => {
            message.success("保存成功")
            setOpen(false)
            refresh()
        }
    })

    const columns: ColumnsType<any> = [
        {
            title: '名称',
            dataIndex: 'name',
        },
        {
            title: '用户名',
            dataIndex: 'username',
        },
        {
            title: '管理员',
            dataIndex: 'is_admin',
            render: (is_admin) => is_admin ? '是' : '否'
        },
        {
            title: '',
            dataIndex: 'operations',
            width: 20,
            render: (_, record) => (
                !record.is_admin && (
                    <More onClick={(key) => onMoreClick(key, record)}/>
                )
            )
        }
    ]

    function onMoreClick(key: string, record: any) {
        if (key === 'edit') {
            setOpen(true, record)
        }
    }

    return (
        <Card title={'用户管理'} extra={(
            <IconButton onClick={() => setOpen(true)}>
                <PlusOutlined/>
            </IconButton>
        )}>
            <Table rowKey={'id'} columns={columns} {...tableProps} pagination={false}/>
            <UserModal {...modalProps} />
        </Card>
    )
}

export default UserList
