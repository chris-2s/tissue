import {Button, Checkbox, Col, Form, Input, message, Modal, Row, Space, Tag, Typography} from "antd";
import * as api from "../../../../apis/video";
import {useRequest} from "ahooks";
import React, {useMemo} from "react";
import {FormModalProps} from "../../../../utils/useFormModal.ts";
import RemoteImageEditor from "../../../../components/RemoteImage/editor.tsx";
import {useRouter} from "@tanstack/react-router";

const {Text} = Typography;

interface Props extends FormModalProps {
    onDelete?: (id: number) => void
}

function ModifyModal(props: Props) {

    const {form, onDelete, ...otherProps} = props
    const router = useRouter()
    const id = Form.useWatch('id', form)
    const title = Form.useWatch('title', form)
    const premiered = Form.useWatch('premiered', form)
    const actorsValue = Form.useWatch('actors', form)
    const actorItems = useMemo(() => String(actorsValue || '')
        .split(/[，,]/)
        .map((item) => item.trim())
        .filter(Boolean), [actorsValue])

    const {run: onSearch, loading: onSearching} = useRequest(api.scrapeVideo, {
        manual: true,
        onSuccess: (response) => {
            const result = response.data.data
            form?.setFieldsValue({
                cover: result.cover,
                title: result.title,
                premiered: result.premiered,
                actors: result.actors.map((i: any) => i.name).join(", ")
            })
        }
    })

    function handleSearch() {
        const num = form?.getFieldValue('num').toUpperCase()
        if (!num) return message.error("请输入番号")
        onSearch(num)
    }

    function handleDelete() {
        Modal.confirm({
            title: '是否确认删除',
            onOk: () => {
                onDelete?.(id)
            }
        })
    }

    function renderReadonlyValue(value?: string) {
        return value ? (
            <div className={'min-h-8 rounded-lg bg-[var(--ant-color-fill-quaternary)] px-3 py-2'}>
                <Text>{value}</Text>
            </div>
        ) : (
            <Text type={'secondary'}>暂无</Text>
        )
    }

    return (
        <Modal {...otherProps} title={id ? '编辑订阅' : '新增订阅'} footer={[
            id && <Button key={'delete'} danger onClick={handleDelete}>删除</Button>,
            <Button key={'scrape'} onClick={props.onCancel}>取消</Button>,
            <Button key={'save'} type={"primary"} loading={props.confirmLoading}
                    onClick={() => props.onOk?.()}>确定</Button>,
        ]}>
            <Form form={form} layout={'vertical'}>
                <Form.Item noStyle name={'id'}>
                    <Input style={{display: 'none'}}/>
                </Form.Item>
                <Row gutter={[15, 15]}>
                    <Col span={24} md={11} lg={11}>
                        <Form.Item noStyle name={'cover'}>
                            <RemoteImageEditor disabled={true}/>
                        </Form.Item>
                    </Col>
                    <Col span={24} md={13} lg={13}>
                        <Row gutter={[15, 0]}>
                            <Col span={12}>
                                <Form.Item label={'番号'} name={'num'}>
                                    <Input.Search disabled={false} placeholder={'请输入番号'} enterButton
                                                  onSearch={handleSearch} loading={onSearching}/>
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item label={'发布日期'} name={'premiered'}>
                                    {renderReadonlyValue(premiered)}
                                </Form.Item>
                            </Col>
                            <Col span={24}>
                                <Form.Item label={'标题'} name={'title'}>
                                    <div
                                        className={'min-h-8 rounded-lg bg-[var(--ant-color-fill-quaternary)] px-3 py-2'}>
                                        {title ? <Text>{title}</Text> : <Text type={'secondary'}>暂无</Text>}
                                    </div>
                                </Form.Item>
                            </Col>
                            <Col span={24}>
                                <Form.Item label={'演员'} name={'actors'}>
                                    {actorItems.length ? (
                                        <Space size={[8, 8]} wrap>
                                            {actorItems.map((actor) => (
                                                <Tag
                                                    key={actor}
                                                    className={'cursor-pointer'}
                                                    onClick={(event) => {
                                                        event.preventDefault()
                                                        event.stopPropagation()
                                                        void router.navigate({
                                                            to: '/search',
                                                            search: {mode: 'actor', keyword: actor} as never
                                                        })
                                                    }}
                                                >
                                                    {actor}
                                                </Tag>
                                            ))}
                                        </Space>
                                    ) : (
                                        <Text type={'secondary'}>暂无</Text>
                                    )}
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item label={'包含关键字'} name={'include_keyword'} tooltip={'支持正则表达式'}>
                                    <Input disabled={false}/>
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item label={'排除关键字'} name={'exclude_keyword'} tooltip={'支持正则表达式'}>
                                    <Input disabled={false}/>
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item label={'高清'} name={'is_hd'} valuePropName={'checked'} initialValue={true}>
                                    <Checkbox disabled={false}/>
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item label={'中文'} name={'is_zh'} valuePropName={'checked'} initialValue={false}>
                                    <Checkbox disabled={false}/>
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item label={'无码'} name={'is_uncensored'} valuePropName={'checked'}
                                           initialValue={false}>
                                    <Checkbox disabled={false}/>
                                </Form.Item>
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </Form>
        </Modal>
    )
}

export default ModifyModal
