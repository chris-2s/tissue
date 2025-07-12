import {Checkbox, Form, Input, Modal, Select} from "antd";
import {FormModalProps} from "../../../../utils/useFormModal.ts";
import React from "react";

function ModifyModal(props: FormModalProps) {

    const {form, initValues, ...otherProps} = props

    return (
        <Modal {...otherProps} title={initValues.name}>
            <Form form={form} layout={'vertical'}>
                <Form.Item noStyle name={'id'}>
                    <Input style={{display: 'none'}}/>
                </Form.Item>
                <Form.Item name={'alternate_host'} label={'替代域名'}>
                    <Input placeholder={'当域名失效或替代域名时填写'}/>
                </Form.Item>
                <Form.Item name={'priority'} label={'优先级'} initialValue={0}>
                    <Select>{Array(101).fill(0).map((_, index) => (
                        <Select.Option value={index}>{index}</Select.Option>))}</Select>
                </Form.Item>
                <Form.Item name={'status'} label={'状态'} valuePropName={'checked'}>
                    <Checkbox>启用</Checkbox>
                </Form.Item>
            </Form>
        </Modal>
    )
}

export default ModifyModal
