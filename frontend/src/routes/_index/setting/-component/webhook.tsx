import {Form, Input} from "antd";
import {useTranslation} from "react-i18next";

function Webhook() {
    const {t} = useTranslation(['setting'])
    return (
        <>
            <Form.Item name={['providers', 'webhook', 'url']} label={t('setting:notify.webhookUrl')}>
                <Input/>
            </Form.Item>
        </>
    )
}

export default Webhook
