import {Button, Form, InputNumber, message, Skeleton} from "antd";
import * as api from "../../../apis/setting.ts";
import {useRequest} from "ahooks";
import {createFileRoute} from "@tanstack/react-router";
import {useTranslation} from "react-i18next";


export const Route = createFileRoute('/_index/setting/crawler')({
    component: SettingCrawler
})

function SettingCrawler() {

    const [form] = Form.useForm()
    const {t} = useTranslation(['common', 'setting'])

    const {loading} = useRequest(api.getSettings, {
        onSuccess: (res) => {
            form.setFieldsValue(res.crawler)
        }
    })

    const {run, loading: saving} = useRequest(api.saveSetting, {
        manual: true,
        onSuccess: () => {
            message.success(t('common:feedback.settingsSaved'))
        }
    })

    function onFinish(data: any) {
        run('crawler', data)
    }

    return (
        loading ? (
            <Skeleton active />
        ) : (
            <div className={'w-[600px] max-w-full my-0 mx-auto'}>
                <Form layout={'vertical'} form={form} onFinish={onFinish}>
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
                        label={t('setting:crawler.subscribePauseSeconds')}
                        name={'subscribe_pause_seconds'}
                        tooltip={t('setting:crawler.subscribePauseSecondsTooltip')}
                    >
                        <InputNumber style={{width: '100%'}} min={1}/>
                    </Form.Item>
                    <div style={{textAlign: 'center'}}>
                        <Button type={'primary'} style={{width: 150}} loading={saving} htmlType={"submit"}>{t('common:actions.submit')}</Button>
                    </div>
                </Form>
            </div>
        )
    )
}
