import {Form, Input} from "antd";
import {useTranslation} from "react-i18next";

function Telegram() {
    const {t} = useTranslation(['setting'])
    return (
        <>
            <Form.Item name={['providers', 'telegram', 'token']} label={t('setting:notify.telegramToken')}>
                <Input/>
            </Form.Item>
            <Form.Item name={['providers', 'telegram', 'chat_id']} label={t('setting:notify.telegramChatId')}>
                <Input/>
            </Form.Item>
        </>
    )
}

export default Telegram
