import {DeleteOutlined, EditOutlined, PlusOutlined} from "@ant-design/icons";
import {useRequest} from "ahooks";
import {Button, Card, Form, Input, message, Modal, Space, Switch, Table, Tag, Typography} from "antd";
import {ColumnsType} from "antd/lib/table";
import dayjs from "dayjs";
import React, {useState} from "react";
import * as api from "../../../../apis/user";
import More from "../../../../components/More";
import IconButton from "../../../../components/IconButton";
import {useTranslation} from "react-i18next";

function ApiKeyPanel() {
    const {t} = useTranslation(['user'])
    const [createOpen, setCreateOpen] = useState(false)
    const [renameOpen, setRenameOpen] = useState(false)
    const [createdKey, setCreatedKey] = useState<string>()
    const [selected, setSelected] = useState<api.ApiKeyItem | null>(null)
    const [createForm] = Form.useForm()
    const [renameForm] = Form.useForm()

    const {data = [], loading, refresh} = useRequest(api.listApiKeys)

    const {runAsync: onCreate, loading: creating} = useRequest(api.createApiKey, {
        manual: true,
        onSuccess: (record) => {
            setCreatedKey(record.key)
            setCreateOpen(false)
            createForm.resetFields()
            refresh()
            message.success(t('user:feedback.created'))
        }
    })

    const {runAsync: onUpdate, loading: updating} = useRequest(
        ({id, data}: { id: number, data: api.ApiKeyUpdatePayload }) => api.updateApiKey(id, data),
        {
            manual: true,
            onSuccess: () => {
                refresh()
                message.success(t('user:feedback.saved'))
            }
        }
    )

    const {runAsync: onDelete} = useRequest(api.deleteApiKey, {
        manual: true,
        onSuccess: () => {
            refresh()
            message.success(t('user:feedback.deleted'))
        }
    })

    const columns: ColumnsType<api.ApiKeyItem> = [
        {
            title: t('user:fields.name'),
            dataIndex: 'name',
        },
        {
            title: t('user:apiKey.keyLabel'),
            dataIndex: 'key',
            render: (value: string) => <Typography.Text code>{value}</Typography.Text>
        },
        {
            title: t('user:fields.status'),
            dataIndex: 'enabled',
            render: (enabled: boolean, record) => (
                <Space>
                    <Switch checked={enabled}
                            checkedChildren={t('user:status.enabled')}
                            unCheckedChildren={t('user:status.disabled')}
                            onChange={(checked) => onUpdate({id: record.id, data: {enabled: checked}})}
                    />
                    <Tag color={enabled ? 'success' : 'default'}>{enabled ? t('user:status.enabled') : t('user:status.disabled')}</Tag>
                </Space>
            )
        },
        {
            title: t('user:fields.createdAt'),
            dataIndex: 'create_time',
            render: (value?: string | null) => value ? dayjs(value).format('lll') : '-'
        },
        {
            title: '',
            dataIndex: 'operations',
            width: 20,
            render: (_, record) => (
                <More items={[
                    {key: 'edit', label: t('user:actions.rename'), icon: <EditOutlined/>},
                    {key: 'delete', label: t('common:actions.delete'), icon: <DeleteOutlined/>},
                ]} onClick={(key) => onMoreClick(key, record)}/>
            )
        }
    ]

    async function onCreateSubmit() {
        const values = await createForm.validateFields()
        await onCreate(values)
    }

    async function onRenameSubmit() {
        if (!selected) return
        const values = await renameForm.validateFields()
        await onUpdate({id: selected.id, data: {name: values.name}})
        setRenameOpen(false)
        setSelected(null)
    }

    function onMoreClick(key: string, record: api.ApiKeyItem) {
        if (key === 'edit') {
            setSelected(record)
            renameForm.setFieldsValue({name: record.name})
            setRenameOpen(true)
            return
        }
        Modal.confirm({
            title: t('user:apiKey.deleteConfirmTitle'),
            onOk: () => onDelete(record.id)
        })
    }

    async function copyApiKey() {
        if (!createdKey) return
        await navigator.clipboard.writeText(createdKey)
        message.success(t('user:feedback.copied'))
    }

    return (
        <Card title={t('user:apiKey.title')} extra={(
            <IconButton onClick={() => setCreateOpen(true)}>
                <PlusOutlined/>
            </IconButton>
        )}>
            <Table rowKey={'id'} columns={columns} dataSource={data} loading={loading || updating} pagination={false}/>

            <Modal title={t('user:apiKey.createDialogTitle')}
                   open={createOpen}
                   onCancel={() => setCreateOpen(false)}
                   onOk={onCreateSubmit}
                   confirmLoading={creating}>
                <Form layout={'vertical'} form={createForm}>
                    <Form.Item name={'name'} label={t('user:fields.name')} rules={[{required: true, message: t('user:validation.nameRequired')}]}>
                        <Input placeholder={t('user:apiKey.createPlaceholder')}/>
                    </Form.Item>
                </Form>
            </Modal>

            <Modal title={t('user:apiKey.renameDialogTitle')}
                   open={renameOpen}
                   onCancel={() => setRenameOpen(false)}
                   onOk={onRenameSubmit}
                   confirmLoading={updating}>
                <Form layout={'vertical'} form={renameForm}>
                    <Form.Item name={'name'} label={t('user:fields.name')} rules={[{required: true, message: t('user:validation.nameRequired')}]}>
                        <Input/>
                    </Form.Item>
                </Form>
            </Modal>

            <Modal title={t('user:apiKey.createdDialogTitle')}
                   open={!!createdKey}
                   onCancel={() => setCreatedKey(undefined)}
                   onOk={() => setCreatedKey(undefined)}
                   okText={t('user:apiKey.createdDialogConfirm')}>
                <Typography.Paragraph>
                    {t('user:apiKey.createdDialogDescription')}
                </Typography.Paragraph>
                <Typography.Paragraph copyable={{text: createdKey}}>
                    <Typography.Text code>{createdKey}</Typography.Text>
                </Typography.Paragraph>
                <Button onClick={copyApiKey}>{t('user:actions.copy')}</Button>
            </Modal>
        </Card>
    )
}

export default ApiKeyPanel
