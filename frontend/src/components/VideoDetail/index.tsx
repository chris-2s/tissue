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
import {useTranslation} from "react-i18next";
import Styles from "./index.module.css";
import Websites from "../Websites";
import VideoActors from "../VideoActors";
import RemoteImageEditor from "../RemoteImage/editor.tsx";
import {ManualTransModeOptions} from "../../utils/constants.ts";


interface Props extends ModalProps {
    path?: string,
    mode?: string
    transMode?: string
}

function VideoDetail(props: Props) {

    const {path, mode, transMode, onOk, ...otherProps} = props
    const [form] = Form.useForm()
    const {t} = useTranslation(['video'])
    const allowManualTransMode = mode === 'file' || mode === 'download'

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
            message.success(t('video:detail.messages.scraped'))
        }
    })

    const {run: onSave, loading: onSaving} = useRequest(api.saveVideo, {
        manual: true,
        onSuccess: (response) => {
            message.success(t('video:detail.messages.saved'))
            onOk?.(response.request.data)
        }
    })

    const {run: onDelete, loading: onDeleting} = useRequest(api.deleteVideo, {
        manual: true,
        onSuccess: (response) => {
            message.success(t('video:detail.messages.deleted'))
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
            return message.error(t('video:detail.messages.numRequired'))
        } else {
            return onScrape(num)
        }
    }

    function handleSave(value: any) {
        const selectedTransMode = value.trans_mode_override
        delete value.trans_mode_override
        value.path = path
        return onSave(
            value,
            mode,
            allowManualTransMode ? (selectedTransMode === 'system' ? undefined : selectedTransMode) : transMode
        )
    }

    function handleDelete() {
        Modal.confirm({
            title: t('video:detail.confirm.delete'),
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
                <Button onClick={handleDelete} danger loading={onDeleting}>{t('video:detail.actions.delete')}</Button>
                <Divider orientation={'vertical'}/>
            </>),
            <Button key={'scrape'} onClick={handleScrape} loading={onScraping}>{t('video:detail.actions.scrape')}</Button>,
            <Button key={'save'} type={"primary"} loading={onSaving} onClick={() => form.submit()}>{t('video:detail.actions.confirm')}</Button>,
        ]}>
            {loading ? (
                <div className={'text-center'}><Spin spinning/></div>
            ) : (
                <Form className={Styles.form} form={form} layout={'vertical'} onFinish={handleSave}>
                    <Row gutter={[30, 15]}>
                        <Col span={24} md={10} lg={10}>
                            <Form.Item noStyle name={'cover'}>
                                <RemoteImageEditor/>
                            </Form.Item>
                            <br/>
                            <Form.Item label={t('video:detail.fields.actors')} name={'actors'}>
                                <VideoActors/>
                            </Form.Item>
                            <br/>
                            <Form.Item label={t('video:detail.fields.website')} name={'website'}>
                                <Websites/>
                            </Form.Item>
                        </Col>
                        <Col span={24} md={14} lg={14}>
                            <Row gutter={[15, 15]}>
                                {allowManualTransMode && (
                                    <Col span={24}>
                                        <Form.Item name={'trans_mode_override'} label={t('video:detail.fields.transMode')} initialValue={'system'}
                                                   tooltip={t('video:detail.fields.transModeTooltip')}>
                                            <Select>
                                                {ManualTransModeOptions.map(i => (
                                                    <Select.Option key={i.value} value={i.value}>{t(`video:detail.transMode.${i.value}`)}</Select.Option>
                                                ))}
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                )}
                                <Col span={8}>
                                    <Form.Item name={'num'} label={t('video:detail.fields.num')}
                                               rules={[{required: true, message: t('video:detail.messages.numRequired')}]}>
                                        <Input/>
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item name={'premiered'} label={t('video:detail.fields.premiered')}>
                                        <Input/>
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item name={'rating'} label={t('video:detail.fields.rating')}>
                                        <Input/>
                                    </Form.Item>
                                </Col>
                                <Col span={24}>
                                    <Form.Item name={'title'} label={t('video:detail.fields.title')}>
                                        <Input/>
                                    </Form.Item>
                                </Col>
                                <Col span={24}>
                                    <Form.Item name={'outline-solid'} label={t('video:detail.fields.outline')}>
                                        <Input.TextArea/>
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item name={'studio'} label={t('video:detail.fields.studio')}>
                                        <Input/>
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item name={'publisher'} label={t('video:detail.fields.publisher')}>
                                        <Input/>
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item name={'director'} label={t('video:detail.fields.director')}>
                                        <Input/>
                                    </Form.Item>
                                </Col>
                                <Col span={24}>
                                    <Form.Item name={'tags'} label={t('video:detail.fields.tags')}>
                                        <Select mode={"tags"}/>
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name={'series'} label={t('video:detail.fields.series')}>
                                        <Input/>
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name={'runtime'} label={t('video:detail.fields.runtime')}>
                                        <Input/>
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item name={'is_zh'} label={t('video:detail.fields.isZh')} valuePropName={'checked'}
                                               initialValue={false}>
                                        <Checkbox/>
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item name={'is_uncensored'} label={t('video:detail.fields.isUncensored')} valuePropName={'checked'}
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
