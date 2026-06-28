import {Button, Form, Input, Modal, ModalProps} from "antd";
import {useEffect} from "react";
import {useTranslation} from "react-i18next";


interface Props extends ModalProps {
    data?: any,
    onOk?: (data: any) => void
    onDelete?: (data: any) => void
}

function ModifyModal(props: Props) {
    const {t} = useTranslation(['video'])
    const {data, onOk, onDelete, ...otherProps} = props
    const [form] = Form.useForm()

    useEffect(() => {
        if (props.open) {
            form.setFieldsValue(data)
        } else {
            form.resetFields()
        }
    }, [data, form, props.open])

    function onSave(value: any) {
        onOk?.(value)
    }

    return (
        <Modal title={data ? t('video:actorModal.editTitle') : t('video:actorModal.createTitle')} {...otherProps} footer={[
            data && <Button danger onClick={onDelete}>{t('video:actorModal.delete')}</Button>,
            <Button type={'primary'} onClick={() => form.submit()}>{t('video:actorModal.confirm')}</Button>
        ]}>
            <Form form={form} layout={'vertical'} onFinish={onSave}>
                <Form.Item name={'name'} label={t('video:actorModal.name')} rules={[{required: true, message: t('video:actorModal.nameRequired')}]}>
                    <Input/>
                </Form.Item>
                <Form.Item name={'thumb'} label={t('video:actorModal.avatar')}>
                    <Input/>
                </Form.Item>
            </Form>
        </Modal>
    )
}

export default ModifyModal
