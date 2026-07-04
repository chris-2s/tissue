import {Form, Input, message, Select} from "antd";
import * as api from "../../../apis/setting.ts";
import {useRequest} from "ahooks";
import {createFileRoute} from "@tanstack/react-router";
import {useTranslation} from "react-i18next";
import {TransModeOptions} from "../../../utils/constants.ts";

import SettingPage from "./-components/page.tsx";
import SettingSection from "./-components/section.tsx";


export const Route = createFileRoute('/_index/setting/file')({
    component: SettingFile
})

function SettingFile() {

    const [form] = Form.useForm()
    const {t} = useTranslation(['common', 'setting'])

    const {loading} = useRequest(() => api.readSettingSection('file'), {
        onSuccess: (res) => {
            form.setFieldsValue(res)
        }
    })

    const {run, loading: saving} = useRequest((data) => api.saveSettingSection('file', data), {
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
            title={t('setting:tabs.file')}
        >
            <SettingSection divider={false}>
                <div className={'grid gap-4 lg:grid-cols-2'}>
                    <Form.Item className={'lg:col-span-2'} label={t('setting:file.path')} name={'path'}>
                        <Input/>
                    </Form.Item>
                    <Form.Item label={t('setting:file.transMode')} name={'trans_mode'} tooltip={t('setting:file.transModeTooltip')}>
                        <Select>
                            {TransModeOptions.map(i => (<Select.Option key={i.value}>{t(`setting:transMode.${i.value}`)}</Select.Option>))}
                        </Select>
                    </Form.Item>
                </div>
            </SettingSection>
        </SettingPage>
    )
}
