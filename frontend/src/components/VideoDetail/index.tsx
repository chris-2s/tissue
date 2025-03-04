import {
    Button,
    Checkbox,
    Col, Divider,
    Form,
    Input,
    message,
    Modal,
    ModalProps,
    Row,
    Select,
    Spin,
} from "antd";
import * as api from "../../apis/video.ts";
import React, {useEffect} from "react";
import {useRequest} from "ahooks";
import Styles from "./index.module.css";
import Websites from "../Websites";
import VideoActors from "../VideoActors";
import VideoCoverEditor from "../VideoCover/editor.tsx";


interface Props extends ModalProps {
    path?: string,
    mode?: string
    transMode?: string
}

function VideoDetail(props: Props) {

    const {path, mode, transMode, onOk, ...otherProps} = props
    const [form] = Form.useForm()

    const {run: onLoad, loading} = useRequest(loadVideoDetail, {
        manual: true,
        onSuccess: (response) => {
            form.setFieldsValue(response)
        }
    })

    const {run: onScrape, loading: onScraping} = useRequest(api.scrapeVideo, {
        manual: true,
        onSuccess: (response) => {
            delete response.data.data.is_zh
            delete response.data.data.is_uncensored
            form.setFieldsValue(response.data.data)
            message.success("刮削成功")
        }
    })

    const {run: onSave, loading: onSaving} = useRequest(api.saveVideo, {
        manual: true,
        onSuccess: (response) => {
            message.success('保存成功')
            onOk?.(response.request.data)
        }
    })

    const {run: onDelete, loading: onDeleting} = useRequest(api.deleteVideo, {
        manual: true,
        onSuccess: (response) => {
            message.success('删除成功')
            onOk?.(response.request.data)
        }
    })

    async function loadVideoDetail(path: string) {
        let response = await api.getVideoDetail(path)
        if (!response.num) {
            response = await api.parseVideoNum(path)
        }
        return response
    }

    function handleScrape() {
        const num = form.getFieldValue('num')
        if (!num) {
            return message.error("请输入番号")
        } else {
            return onScrape(num)
        }
    }

    function handleSave(value: any) {
        if (value.actors.length === 0) {
            return message.error("请至少添加一名演员")
        }
        value.path = path
        return onSave(value, mode, transMode)
    }

    function handleDelete() {
        Modal.confirm({
            title: '是否确认删除',
            onOk: () => {
                onDelete(path)
            }
        })
    }

    useEffect(() => {
        if (otherProps.open && path) {
            onLoad(path)
        } else {
            form.resetFields()
        }
    }, [otherProps.open])

    return (
        <Modal {...otherProps} footer={[
            mode === 'video' && (<>
                <Button onClick={handleDelete} danger loading={onDeleting}>删除</Button>
                <Divider type={'vertical'}/>
            </>),
            <Button key={'scrape'} onClick={handleScrape} loading={onScraping}>刮削</Button>,
            <Button key={'save'} type={"primary"} loading={onSaving} onClick={() => form.submit()}>确定</Button>,
        ]}>
            {loading ? (
                <div className={'text-center'}><Spin spinning/></div>
            ) : (
                <Form className={Styles.form} form={form} layout={'vertical'} onFinish={handleSave}>
                    <Row gutter={[30, 15]}>
                        <Col span={24} md={10} lg={10}>
                            <Form.Item noStyle name={'cover'}>
                                <VideoCoverEditor/>
                            </Form.Item>
                            <br/>
                            <Form.Item label={'演员'} name={'actors'}>
                                <VideoActors/>
                            </Form.Item>
                            <br/>
                            <Form.Item label={'网站'} name={'website'}>
                                <Websites/>
                            </Form.Item>
                        </Col>
                        <Col span={24} md={14} lg={14}>
                            <Row gutter={[15, 15]}>
                                <Col span={8}>
                                    <Form.Item name={'num'} label={'番号'}
                                               rules={[{required: true, message: '请输入番号'}]}>
                                        <Input/>
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item name={'premiered'} label={'发行时间'}>
                                        <Input/>
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item name={'rating'} label={'评分'}>
                                        <Input/>
                                    </Form.Item>
                                </Col>
                                <Col span={24}>
                                    <Form.Item name={'title'} label={'标题'}>
                                        <Input/>
                                    </Form.Item>
                                </Col>
                                <Col span={24}>
                                    <Form.Item name={'outline'} label={'大纲'}>
                                        <Input.TextArea/>
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item name={'studio'} label={'制造商'}>
                                        <Input/>
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item name={'publisher'} label={'发行商'}>
                                        <Input/>
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item name={'director'} label={'导演'}>
                                        <Input/>
                                    </Form.Item>
                                </Col>
                                <Col span={24}>
                                    <Form.Item name={'tags'} label={'类别'}>
                                        <Select mode={"tags"}/>
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name={'series'} label={'系列'}>
                                        <Input/>
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name={'runtime'} label={'时长(分钟)'}>
                                        <Input/>
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item name={'is_zh'} label={'是否中文'} valuePropName={'checked'}
                                               initialValue={false}>
                                        <Checkbox/>
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item name={'is_uncensored'} label={'是否无码'} valuePropName={'checked'}
                                               initialValue={false}>
                                        <Checkbox/>
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                </Form>
            )}
        </Modal>
    )
}

export default VideoDetail
