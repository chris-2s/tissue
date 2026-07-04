import {Form, Input, message} from "antd";
import * as api from "../../../apis/setting.ts";
import {useRequest} from "ahooks";
import {createFileRoute} from "@tanstack/react-router";
import {useTranslation} from "react-i18next";

import SettingPage from "./-components/page.tsx";
import SettingSection from "./-components/section.tsx";


export const Route = createFileRoute('/_index/setting/library')({
    component: SettingLibrary
})

function SettingLibrary() {

    const [form] = Form.useForm()
    const {t} = useTranslation(['common', 'setting'])

    const {loading} = useRequest(() => api.readSettingSection('library'), {
        onSuccess: (res) => {
            form.setFieldsValue(res)
        }
    })

    const {run, loading: saving} = useRequest((data) => api.saveSettingSection('library', data), {
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
            title={t('setting:tabs.library')}
        >
            <SettingSection divider={false}>
                <div className={'grid gap-4 lg:grid-cols-2'}>
                    <Form.Item className={'lg:col-span-2'} label={t('setting:library.videoPath')} name={'video_path'}>
                        <Input/>
                    </Form.Item>
                    <Form.Item label={t('setting:library.videoFormat')} name={'video_format'}>
                        <Input/>
                    </Form.Item>
                    <Form.Item label={t('setting:library.videoSizeMinimum')} name={'video_size_minimum'}>
                        <Input/>
                    </Form.Item>
                </div>
            </SettingSection>
        </SettingPage>
    )
}
