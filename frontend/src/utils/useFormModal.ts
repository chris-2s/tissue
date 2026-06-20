import {useState} from "react";
import {Form, FormInstance, ModalProps} from "antd";

interface Params {
    service: ((...args: any[]) => Promise<any>)
    onOk: (data: any) => void
}

export interface FormModalProps extends Omit<ModalProps, 'onOk' | 'onCancel' | 'confirmLoading'> {
    form?: FormInstance
    initValues?: any
    onOk?: () => void | Promise<void>
    onCancel?: () => void
    confirmLoading?: boolean
}

export function useFormModal(params: Params) {

    const [open, setModalOpen] = useState(false)
    const [values, setValues] = useState<any>({})
    const [form] = Form.useForm()
    const [confirmLoading, setConfirmLoading] = useState(false)

    function setOpen(isOpen: boolean, records?: any) {
        setValues(records)
        form.setFieldsValue(records)
        setModalOpen(isOpen)
    }

    async function onOk() {
        try {
            setConfirmLoading(true)
            const formData = await form.validateFields()
            const data = {...values, ...formData}

            const service = params.service(data)
            const response = await service
            params.onOk(response.data)
            setValues({})
            form.resetFields()
        } catch {

        } finally {
            setConfirmLoading(false)
        }
    }

    function onCancel() {
        setModalOpen(false)
        setValues({})
        form.resetFields()
    }

    return {
        modalProps: {
            open,
            onOk,
            onCancel,
            form,
            confirmLoading,
            initValues: values
        },
        open,
        setOpen,
    }
}
