import {DeleteOutlined, EditOutlined, PlusOutlined} from "@ant-design/icons";
import {useRequest} from "ahooks";
import {Button, Card, Form, Input, message, Modal, Space, Switch, Table, Tag, Typography} from "antd";
import {ColumnsType} from "antd/lib/table";
import dayjs from "dayjs";
import React, {useState} from "react";
import * as api from "../../../../apis/user";
import More from "../../../../components/More";
import IconButton from "../../../../components/IconButton";

function ApiKeyPanel() {
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
            message.success('创建成功')
        }
    })

    const {runAsync: onUpdate, loading: updating} = useRequest(
        ({id, data}: { id: number, data: api.ApiKeyUpdatePayload }) => api.updateApiKey(id, data),
        {
            manual: true,
            onSuccess: () => {
                refresh()
                message.success('保存成功')
            }
        }
    )

    const {runAsync: onDelete} = useRequest(api.deleteApiKey, {
        manual: true,
        onSuccess: () => {
            refresh()
            message.success('删除成功')
        }
    })

    const columns: ColumnsType<api.ApiKeyItem> = [
        {
            title: '名称',
            dataIndex: 'name',
        },
        {
            title: 'Key',
            dataIndex: 'key',
            render: (value: string) => <Typography.Text code>{value}</Typography.Text>
        },
        {
            title: '状态',
            dataIndex: 'enabled',
            render: (enabled: boolean, record) => (
                <Space>
                    <Switch checked={enabled}
                            checkedChildren={'启用'}
                            unCheckedChildren={'禁用'}
                            onChange={(checked) => onUpdate({id: record.id, data: {enabled: checked}})}
                    />
                    <Tag color={enabled ? 'success' : 'default'}>{enabled ? '启用' : '禁用'}</Tag>
                </Space>
            )
        },
        {
            title: '创建时间',
            dataIndex: 'create_time',
            render: (value?: string | null) => value ? dayjs(value).format('lll') : '-'
        },
        {
            title: '',
            dataIndex: 'operations',
            width: 20,
            render: (_, record) => (
                <More items={[
                    {key: 'edit', label: '重命名', icon: <EditOutlined/>},
                    {key: 'delete', label: '删除', icon: <DeleteOutlined/>},
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
            title: '是否确认删除该 API Key',
            onOk: () => onDelete(record.id)
        })
    }

    async function copyApiKey() {
        if (!createdKey) return
        await navigator.clipboard.writeText(createdKey)
        message.success('已复制')
    }

    return (
        <Card title={'API Key 管理'} extra={(
            <IconButton onClick={() => setCreateOpen(true)}>
                <PlusOutlined/>
            </IconButton>
        )}>
            <Table rowKey={'id'} columns={columns} dataSource={data} loading={loading || updating} pagination={false}/>

            <Modal title={'新建 API Key'}
                   open={createOpen}
                   onCancel={() => setCreateOpen(false)}
                   onOk={onCreateSubmit}
                   confirmLoading={creating}>
                <Form layout={'vertical'} form={createForm}>
                    <Form.Item name={'name'} label={'名称'} rules={[{required: true, message: '请输入名称'}]}>
                        <Input placeholder={'例如：Jellyfin 同步脚本'}/>
                    </Form.Item>
                </Form>
            </Modal>

            <Modal title={'重命名 API Key'}
                   open={renameOpen}
                   onCancel={() => setRenameOpen(false)}
                   onOk={onRenameSubmit}
                   confirmLoading={updating}>
                <Form layout={'vertical'} form={renameForm}>
                    <Form.Item name={'name'} label={'名称'} rules={[{required: true, message: '请输入名称'}]}>
                        <Input/>
                    </Form.Item>
                </Form>
            </Modal>

            <Modal title={'API Key 已创建'}
                   open={!!createdKey}
                   onCancel={() => setCreatedKey(undefined)}
                   onOk={() => setCreatedKey(undefined)}
                   okText={'我已保存'}>
                <Typography.Paragraph>
                    完整 Key 仅展示一次，请立即保存：
                </Typography.Paragraph>
                <Typography.Paragraph copyable={{text: createdKey}}>
                    <Typography.Text code>{createdKey}</Typography.Text>
                </Typography.Paragraph>
                <Button onClick={copyApiKey}>复制</Button>
            </Modal>
        </Card>
    )
}

export default ApiKeyPanel
