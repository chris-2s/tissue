import {Form, Input} from "antd";

function Telegram() {
    return (
        <>
            <Form.Item name={'telegram_token'} label={'Token'}>
                <Input/>
            </Form.Item>
            <Form.Item name={'telegram_chat_id'} label={'Chat ID'}>
                <Input/>
            </Form.Item>
        </>
    )
}

export default Telegram
