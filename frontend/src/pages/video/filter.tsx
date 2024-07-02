import {Checkbox, Form, Input, List, Modal, ModalProps, Select} from "antd";

export interface FilterParams {
    title?: string
    actors?: string[]
}

interface Props extends ModalProps {
    actors: any[]
    onCancel: () => void
    onFilter: (params: FilterParams) => void
}

function VideoFilterModal(props: Props) {

    const {onFilter, actors = [], onCancel, ...otherProps} = props
    const [form] = Form.useForm()

    async function onOk() {
        const values = await form.validateFields()
        onFilter(values)
    }

    function handleCancel() {
        form.resetFields()
        onFilter({})
    }

    const actorOptions = actors.map(actor => (
        {label: `${actor.name}(${actor.count}部)`, value: actor.name}
    ))

    return (
        <Modal title={'影片过滤'} {...otherProps} onCancel={handleCancel} cancelText={'重置'} onOk={onOk}>
            <Form form={form} layout={'vertical'}>
                <Form.Item name={'title'} label={'标题'}>
                    <Input allowClear/>
                </Form.Item>
                <Form.Item name={'actors'} label={'演员'}>
                    <Checkbox.Group options={actorOptions}/>
                </Form.Item>
            </Form>
        </Modal>
    )
}

export default VideoFilterModal
