import {Button, Form, Input, message, Select, Skeleton} from "antd";
import * as api from "../../../apis/setting.ts";
import {useRequest} from "ahooks";
import {createFileRoute} from "@tanstack/react-router";
import {useTranslation} from "react-i18next";
import {TransModeOptions} from "../../../utils/constants.ts";


export const Route = createFileRoute('/_index/setting/file')({
    component: SettingFile
})

function SettingFile() {

    const [form] = Form.useForm()
    const {t} = useTranslation(['common', 'setting'])

    const {loading} = useRequest(api.getSettings, {
        onSuccess: (res) => {
            form.setFieldsValue(res.file)
        }
    })

    const {run, loading: saving} = useRequest(api.saveSetting, {
        manual: true,
        onSuccess: () => {
            message.success(t('common:feedback.settingsSaved'))
        }
    })

    function onFinish(data: any) {
        run('file', data)
    }

    return (
        loading ? (
            <Skeleton active/>
        ) : (
            <div className={'w-[600px] max-w-full my-0 mx-auto'}>
                <Form layout={'vertical'} form={form} onFinish={onFinish}>
                    <Form.Item label={t('setting:file.path')} name={'path'}>
                        <Input/>
                    </Form.Item>
                    <Form.Item label={t('setting:file.transMode')} name={'trans_mode'} tooltip={t('setting:file.transModeTooltip')}>
                        <Select>
                            {TransModeOptions.map(i => (<Select.Option key={i.value}>{t(`setting:transMode.${i.value}`)}</Select.Option>))}
                        </Select>
                    </Form.Item>
                    <div style={{textAlign: 'center'}}>
                        <Button type={'primary'} style={{width: 150}} loading={saving}
                                htmlType={"submit"}>{t('common:actions.submit')}</Button>
                    </div>
                </Form>
            </div>
        )
    )
}
