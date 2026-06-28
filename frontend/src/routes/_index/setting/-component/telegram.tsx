import {Form, Input} from "antd";

function Telegram() {
    return (
        <>
            <Form.Item name={['providers', 'telegram', 'token']} label={'Token'}>
                <Input/>
            </Form.Item>
            <Form.Item name={['providers', 'telegram', 'chat_id']} label={'Chat ID'}>
                <Input/>
            </Form.Item>
        </>
    )
}

export default Telegram
