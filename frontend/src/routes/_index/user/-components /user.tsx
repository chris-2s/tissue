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
import {useTranslation} from "react-i18next";

function UserList() {
    const {t} = useTranslation(['user', 'common'])
    const {tableProps, refresh} = useAntdTable(api.getUsers)
    const {setOpen, modalProps} = useFormModal({
        service: api.modifyUser,
        onOk: () => {
            message.success(t('user:feedback.saved'))
            setOpen(false)
            refresh()
        }
    })

    const columns: ColumnsType<any> = [
        {
            title: t('user:fields.name'),
            dataIndex: 'name',
        },
        {
            title: t('user:fields.username'),
            dataIndex: 'username',
        },
        {
            title: t('user:fields.admin'),
            dataIndex: 'is_admin',
            render: (is_admin) => is_admin ? t('user:status.yes') : t('user:status.no')
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
        <Card title={t('user:list.title')} extra={(
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
