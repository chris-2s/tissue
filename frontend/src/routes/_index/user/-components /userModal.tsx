import React from "react";
import {Form, Input, Modal} from "antd";
import {FormModalProps} from "../../../../utils/useFormModal.ts";

function UserModal(props: FormModalProps) {

    const {form, initValues, ...otherProps} = props

    const id = initValues?.id

    return (
        <Modal title={id ? '编辑用户' : '新建用户'} {...otherProps}>
            <Form layout={'vertical'} form={form}>
                <Form.Item name={'name'} label={'名称'} rules={[{required: true, message: '请输入名称'}]}>
                    <Input/>
                </Form.Item>
                <Form.Item name={'username'} label={'用户名'} rules={[{required: true, message: '请输入用户名'}]}>
                    <Input/>
                </Form.Item>
                <Form.Item name={'password'} label={'新密码'} rules={[{required: !id}]}>
                    <Input.Password/>
                </Form.Item>
                <Form.Item name={'confirmPassword'} label={'确认新密码'} rules={[{required: !id}]}>
                    <Input.Password/>
                </Form.Item>
            </Form>
        </Modal>
    )
}

export default UserModal
