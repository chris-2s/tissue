import {Button, Form, Input, Modal, ModalProps} from "antd";
import {useEffect} from "react";


interface Props extends ModalProps {
    data?: any,
    onOk?: (data: any) => void
    onDelete?: (data: any) => void
}

function ModifyModal(props: Props) {

    const {data, onOk, onDelete, ...otherProps} = props
    const [form] = Form.useForm()

    useEffect(() => {
        if (props.open) {
            form.setFieldsValue(data)
        } else {
            form.resetFields()
        }
    }, [props.open])

    function onSave(value: any) {
        onOk?.(value)
    }

    return (
        <Modal title={data ? '修改' : '新增'} {...otherProps} footer={[
            data && <Button danger onClick={onDelete}>删除</Button>,
            <Button type={'primary'} onClick={() => form.submit()}>确定</Button>
        ]}>
            <Form form={form} layout={'vertical'} onFinish={onSave}>
                <Form.Item name={'name'} label={'姓名'} rules={[{required: true, message: '请输入姓名'}]}>
                    <Input/>
                </Form.Item>
                <Form.Item name={'thumb'} label={'头像'}>
                    <Input/>
                </Form.Item>
            </Form>
        </Modal>
    )
}

export default ModifyModal
