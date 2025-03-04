import {Button, Checkbox, Form, Input, Modal, ModalProps, Space} from "antd";

export interface FilterParams {
    title?: string
    actors?: string[]
}

interface Props extends ModalProps {
    actors: any[]
    initialValues: any
    onFilter: (params: FilterParams) => void
}

function VideoFilterModal(props: Props) {

    const {onFilter, actors = [], initialValues, ...otherProps} = props
    const [form] = Form.useForm()

    async function onOk() {
        const values = await form.validateFields()
        onFilter(values)
    }

    function handleRest() {
        form.resetFields()
        onFilter({})
    }

    const actorOptions = actors.map(actor => (
        {label: `${actor.name}(${actor.count}部)`, value: actor.name}
    ))

    return (
        <Modal title={'影片过滤'} {...otherProps} footer={(
            <Space>
                <Button onClick={handleRest}>重 制</Button>
                <Button type={'primary'} onClick={onOk}>确 定</Button>
            </Space>
        )}>
            <Form form={form} layout={'vertical'} initialValues={initialValues}>
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
