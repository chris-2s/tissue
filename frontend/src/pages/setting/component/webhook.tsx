import {Form, Input} from "antd";

function Telegram() {
    return (
        <>
            <Form.Item name={'url'} label={'URL'}>
                <Input/>
            </Form.Item>
        </>
    )
}

export default Telegram
