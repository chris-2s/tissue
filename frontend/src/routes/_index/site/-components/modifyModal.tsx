import {Checkbox, Form, Input, Modal, Select} from "antd";
import {FormModalProps} from "../../../../utils/useFormModal.ts";
import React from "react";
import {useTranslation} from "react-i18next";

function ModifyModal(props: FormModalProps) {
    const {t} = useTranslation(['site'])

    const {form, initValues, ...otherProps} = props

    return (
        <Modal {...otherProps} title={initValues.name}>
            <Form form={form} layout={'vertical'}>
                <Form.Item noStyle name={'id'}>
                    <Input style={{display: 'none'}}/>
                </Form.Item>
                <Form.Item name={'alternate_host'} label={t('site:modals.alternateHost')}>
                    <Input placeholder={t('site:modals.alternateHostPlaceholder')}/>
                </Form.Item>
                <Form.Item name={'priority'} label={t('site:modals.priority')} initialValue={0}>
                    <Select>{Array(101).fill(0).map((_, index) => (
                        <Select.Option value={index}>{index}</Select.Option>))}</Select>
                </Form.Item>
                <Form.Item name={'status'} label={t('site:modals.status')} valuePropName={'checked'}>
                    <Checkbox>{t('site:modals.enabled')}</Checkbox>
                </Form.Item>
                <Form.Item name={'cookies'} label={t('site:modals.cookies')}>
                    <Input.TextArea
                        placeholder={t('site:modals.cookiesPlaceholder')}
                        rows={4}
                        style={{fontFamily: 'monospace'}}
                    />
                </Form.Item>
            </Form>
        </Modal>
    )
}

export default ModifyModal
