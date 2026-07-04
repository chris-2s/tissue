import {Form, Input, message, Switch} from "antd";
import * as api from "../../../apis/setting";
import {useRequest} from "ahooks";
import {createFileRoute} from "@tanstack/react-router";
import {useTranslation} from "react-i18next";

import SettingPage from "./-components/page.tsx";
import SettingSection from "./-components/section.tsx";


export const Route = createFileRoute('/_index/setting/cookiecloud')({
    component: SettingCookieCloud
})

function SettingCookieCloud() {

    const [form] = Form.useForm()
    const {t} = useTranslation(['common', 'setting'])

    const {loading} = useRequest(() => api.readSettingSection('cookiecloud'), {
        onSuccess: (res) => {
            form.setFieldsValue(res)
        }
    })

    const {run, loading: saving} = useRequest((data) => api.saveSettingSection('cookiecloud', data), {
        manual: true,
        onSuccess: () => {
            message.success(t('common:feedback.settingsSaved'))
        }
    })

    function onFinish(data: any) {
        run(data)
    }

    return (
        <SettingPage
            form={form}
            loading={loading}
            onFinish={onFinish}
            saving={saving}
            submitLabel={t('common:actions.submit')}
            title={t('setting:tabs.cookiecloud')}
        >
            <SettingSection divider={false}>
                <div className={'grid gap-4 lg:grid-cols-2'}>
                    <Form.Item className={'lg:col-span-2'} label={t('setting:cookiecloud.enabled')} name={'enabled'} valuePropName={'checked'}>
                        <Switch/>
                    </Form.Item>
                    <Form.Item label={t('setting:cookiecloud.host')} name={'host'}>
                        <Input placeholder={t('setting:cookiecloud.hostPlaceholder')}/>
                    </Form.Item>
                    <Form.Item label={t('setting:cookiecloud.uuid')} name={'uuid'}>
                        <Input placeholder={t('setting:cookiecloud.uuidPlaceholder')}/>
                    </Form.Item>
                    <Form.Item className={'lg:col-span-2'} label={t('setting:cookiecloud.password')} name={'password'}>
                        <Input.Password placeholder={t('setting:cookiecloud.passwordPlaceholder')}/>
                    </Form.Item>
                </div>
            </SettingSection>
        </SettingPage>
    )
}
