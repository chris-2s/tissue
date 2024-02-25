import {Button, Checkbox, Col, Form, Input, message, Modal, Row} from "antd";
import {FormModalProps} from "../../utils/useFormModal";
import VideoCoverEditor from "../../components/VideoCover/editor";
import * as api from "../../apis/video";
import {useRequest} from "ahooks";
import DatePicker from "../../components/DatePicker";
import React from "react";

interface Props extends FormModalProps {
    onDelete: (id: number) => void
}

function ModifyModal(props: Props) {

    const {form, onDelete, ...otherProps} = props
    const id = Form.useWatch('id', form)

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
        const num = form?.getFieldValue('num')
        if (!num) return message.error("请输入番号")
        onSearch(num)
    }

    function handleDelete() {
        Modal.confirm({
            title: '是否确认删除',
            onOk: () => {
                onDelete(id)
            }
        })
    }

    return (
        <Modal {...otherProps} title={id ? '编辑订阅' : '新增订阅'} footer={[
            id && <Button key={'delete'} danger onClick={handleDelete}>删除</Button>,
            <Button key={'scrape'} onClick={props.onCancel}>取消</Button>,
            <Button key={'save'} type={"primary"} loading={props.confirmLoading}
                    onClick={props.onOk}>确定</Button>,
        ]}>
            <Form form={form} layout={'vertical'}>
                <Form.Item noStyle name={'id'}>
                    <Input style={{display: 'none'}}/>
                </Form.Item>
                <Row gutter={[15, 15]}>
                    <Col span={24} lg={11}>
                        <Form.Item noStyle name={'cover'}>
                            <VideoCoverEditor disabled={true}/>
                        </Form.Item>
                    </Col>
                    <Col span={24} lg={13}>
                        <Row gutter={[15, 0]}>
                            <Col span={12}>
                                <Form.Item label={'番号'} name={'num'}>
                                    <Input.Search disabled={false} placeholder={'请输入番号'} enterButton
                                                  onSearch={handleSearch} loading={onSearching}/>
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item label={'发布日期'} name={'premiered'}>
                                    <DatePicker style={{width: '100%'}}/>
                                </Form.Item>
                            </Col>
                            <Col span={24}>
                                <Form.Item label={'标题'} name={'title'}>
                                    <Input/>
                                </Form.Item>
                            </Col>
                            <Col span={24}>
                                <Form.Item label={'演员'} name={'actors'}>
                                    <Input/>
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item label={'高清'} name={'is_hd'} valuePropName={'checked'} initialValue={true}>
                                    <Checkbox/>
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item label={'中文'} name={'is_zh'} valuePropName={'checked'} initialValue={false}>
                                    <Checkbox/>
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item label={'无码'} name={'is_uncensored'} valuePropName={'checked'}
                                           initialValue={false}>
                                    <Checkbox/>
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
