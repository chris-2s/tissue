import {Form, message, Select} from "antd";
import {useRequest} from "ahooks";
import * as api from "../../../apis/setting.ts";
import Telegram from "./-component/telegram.tsx";
import Webhook from "./-component/webhook.tsx";
import {createFileRoute} from "@tanstack/react-router";
import {useTranslation} from "react-i18next";

import SettingPage from "./-components/page.tsx";
import SettingSection from "./-components/section.tsx";

const notifications = [
    {name: 'Telegram', value: 'telegram', element: Telegram},
    {name: 'Webhook', value: 'webhook', element: Webhook},
]

export const Route = createFileRoute('/_index/setting/notify')({
    component: SettingNotify
})

function SettingNotify() {

    const [form] = Form.useForm()
    const {t} = useTranslation(['common', 'setting'])

    const provider = Form.useWatch('provider', form)

    const {loading} = useRequest(() => api.readSettingSection<any>('notify'), {
        onSuccess: (res) => {
            form.setFieldsValue({
                provider: 'telegram',
                providers: {
                    telegram: {token: '', chat_id: ''},
                    webhook: {url: ''},
                },
                ...(res || {}),
            })
        }
    })

    const {run, loading: saving} = useRequest((data) => api.saveSettingSection('notify', data), {
        manual: true,
        onSuccess: () => {
            message.success(t('common:feedback.settingsSaved'))
        }
    })

    function onFinish(data: any) {
        data.provider = data.provider || 'telegram'
        run(data)
    }

    const ItemElement = notifications.find(item => item.value === provider)?.element

    return (
        <SettingPage
            form={form}
            loading={loading}
            onFinish={onFinish}
            saving={saving}
            submitLabel={t('common:actions.submit')}
            title={t('setting:tabs.notify')}
        >
            <SettingSection title={t('setting:notify.provider')}>
                <div className={'grid gap-4 lg:grid-cols-2'}>
                    <Form.Item className={'lg:col-span-2'} name={'provider'} label={t('setting:notify.provider')} initialValue={'telegram'}>
                        <Select>
                            {notifications.map(item => (
                                <Select.Option key={item.value} value={item.value}>{t(`setting:notify.${item.value}`)}</Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                </div>
            </SettingSection>
            <SettingSection divider={false} title={t(`setting:notify.${provider || 'telegram'}`)}>
                {ItemElement && (<ItemElement/>)}
            </SettingSection>
        </SettingPage>
    )
}
