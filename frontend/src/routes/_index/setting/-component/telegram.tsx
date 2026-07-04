import {Form, Input} from "antd";
import {useTranslation} from "react-i18next";

function Telegram() {
    const {t} = useTranslation(['setting'])
    return (
        <div className={'grid gap-4 lg:grid-cols-2'}>
            <Form.Item className={'lg:col-span-2'} name={['providers', 'telegram', 'token']} label={t('setting:notify.telegramToken')}>
                <Input.Password autoComplete={'new-password'}/>
            </Form.Item>
            <Form.Item className={'lg:col-span-2'} name={['providers', 'telegram', 'chat_id']} label={t('setting:notify.telegramChatId')}>
                <Input/>
            </Form.Item>
        </div>
    )
}

export default Telegram
