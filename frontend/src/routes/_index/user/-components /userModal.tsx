import React from "react";
import {Form, Input, Modal} from "antd";
import {FormModalProps} from "../../../../utils/useFormModal.ts";
import {useTranslation} from "react-i18next";

function UserModal(props: FormModalProps) {
    const {t} = useTranslation(['user'])

    const {form, initValues, ...otherProps} = props

    const id = initValues?.id

    return (
        <Modal title={id ? t('user:modal.editUserTitle') : t('user:modal.createUserTitle')} {...otherProps}>
            <Form layout={'vertical'} form={form}>
                <Form.Item name={'name'} label={t('user:fields.name')} rules={[{required: true, message: t('user:validation.nameRequired')}]}>
                    <Input/>
                </Form.Item>
                <Form.Item name={'username'} label={t('user:fields.username')} rules={[{required: true, message: t('user:validation.usernameRequired')}]}>
                    <Input/>
                </Form.Item>
                <Form.Item name={'password'} label={t('user:fields.password')} rules={[{required: !id}]}>
                    <Input.Password/>
                </Form.Item>
                <Form.Item name={'confirmPassword'} label={t('user:fields.confirmPassword')} rules={[{required: !id}]}>
                    <Input.Password/>
                </Form.Item>
            </Form>
        </Modal>
    )
}

export default UserModal
