import {Button, Form, Input, message, Skeleton, Switch} from "antd";
import * as api from "../../../apis/setting";
import {useRequest} from "ahooks";
import {createFileRoute} from "@tanstack/react-router";
import {useTranslation} from "react-i18next";


export const Route = createFileRoute('/_index/setting/cookiecloud')({
    component: SettingCookieCloud
})

function SettingCookieCloud() {

    const [form] = Form.useForm()
    const {t} = useTranslation(['common', 'setting'])

    const {loading} = useRequest(api.getSettings, {
        onSuccess: (res) => {
            form.setFieldsValue(res.cookiecloud)
        }
    })

    const {run, loading: saving} = useRequest(api.saveSetting, {
        manual: true,
        onSuccess: () => {
            message.success(t('common:feedback.settingsSaved'))
        }
    })

    function onFinish(data: any) {
        run('cookiecloud', data)
    }

    return (
        loading ? (
            <Skeleton active />
        ) : (
            <div className={'w-[600px] max-w-full my-0 mx-auto'}>
                <Form layout={'vertical'} form={form} onFinish={onFinish}>
                    <Form.Item label={t('setting:cookiecloud.enabled')} name={'enabled'} valuePropName={'checked'}>
                        <Switch/>
                    </Form.Item>
                    <Form.Item label={t('setting:cookiecloud.host')} name={'host'}>
                        <Input placeholder={t('setting:cookiecloud.hostPlaceholder')}/>
                    </Form.Item>
                    <Form.Item label={t('setting:cookiecloud.uuid')} name={'uuid'}>
                        <Input placeholder={t('setting:cookiecloud.uuidPlaceholder')}/>
                    </Form.Item>
                    <Form.Item label={t('setting:cookiecloud.password')} name={'password'}>
                        <Input.Password placeholder={t('setting:cookiecloud.passwordPlaceholder')}/>
                    </Form.Item>
                    <div style={{textAlign: 'center'}}>
                        <Button type={'primary'} style={{width: 150}} loading={saving} htmlType={"submit"}>{t('common:actions.submit')}</Button>
                    </div>
                </Form>
            </div>
        )
    )
}
