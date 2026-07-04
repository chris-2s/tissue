import {Form, Input} from "antd";
import {useTranslation} from "react-i18next";

function Webhook() {
    const {t} = useTranslation(['setting'])
    return (
        <div className={'grid gap-4 lg:grid-cols-2'}>
            <Form.Item className={'lg:col-span-2'} name={['providers', 'webhook', 'url']} label={t('setting:notify.webhookUrl')}>
                <Input/>
            </Form.Item>
        </div>
    )
}

export default Webhook
