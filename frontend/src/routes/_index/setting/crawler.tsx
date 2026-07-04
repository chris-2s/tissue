import {Form, InputNumber, message} from "antd";
import * as api from "../../../apis/setting.ts";
import {useRequest} from "ahooks";
import {createFileRoute} from "@tanstack/react-router";
import {useTranslation} from "react-i18next";

import SettingPage from "./-components/page.tsx";
import SettingSection from "./-components/section.tsx";


export const Route = createFileRoute('/_index/setting/crawler')({
    component: SettingCrawler
})

function SettingCrawler() {

    const [form] = Form.useForm()
    const {t} = useTranslation(['common', 'setting'])

    const {loading} = useRequest(() => api.readSettingSection('crawler'), {
        onSuccess: (res) => {
            form.setFieldsValue(res)
        }
    })

    const {run, loading: saving} = useRequest((data) => api.saveSettingSection('crawler', data), {
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
            title={t('setting:tabs.crawler')}
        >
            <SettingSection divider={false}>
                <div className={'grid gap-4 lg:grid-cols-2'}>
                    <Form.Item label={t('setting:crawler.timeout')} name={'timeout'}>
                        <InputNumber style={{width: '100%'}}/>
                    </Form.Item>
                    <Form.Item
                        label={t('setting:crawler.subscribeIntervalMinutes')}
                        name={'subscribe_interval_minutes'}
                        tooltip={t('setting:crawler.subscribeIntervalMinutesTooltip')}
                    >
                        <InputNumber style={{width: '100%'}} min={15}/>
                    </Form.Item>
                    <Form.Item
                        className={'lg:col-span-2'}
                        label={t('setting:crawler.subscribePauseSeconds')}
                        name={'subscribe_pause_seconds'}
                        tooltip={t('setting:crawler.subscribePauseSecondsTooltip')}
                    >
                        <InputNumber style={{width: '100%'}} min={1}/>
                    </Form.Item>
                </div>
            </SettingSection>
        </SettingPage>
    )
}
