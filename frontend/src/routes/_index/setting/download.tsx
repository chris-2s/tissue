import {Button, Form, Input, message, Select, Skeleton, Switch} from "antd";
import * as api from "../../../apis/setting.ts";
import {useRequest} from "ahooks";
import {createFileRoute} from "@tanstack/react-router";
import {useTranslation} from "react-i18next";
import {TransModeOptions} from "../../../utils/constants.ts";

const defaultProvider = 'qbittorrent'

export const Route = createFileRoute('/_index/setting/download')({
    component: SettingDownload
})

function SettingDownload() {

    const [form] = Form.useForm()
    const {t} = useTranslation(['common', 'setting'])

    const {loading} = useRequest(api.getSettings, {
        onSuccess: (res) => {
            form.setFieldsValue({
                provider: defaultProvider,
                providers: {
                    qbittorrent: {
                        host: '',
                        username: '',
                        password: '',
                        tracker_subscribe: '',
                    },
                },
                ...res.download,
            })
        }
    })

    const {run, loading: saving} = useRequest(api.saveSetting, {
        manual: true,
        onSuccess: () => {
            message.success(t('common:feedback.settingsSaved'))
        }
    })

    function onFinish(data: any) {
        data.provider = data.provider || defaultProvider
        run('download', data)
    }

    return (
        loading ? (
            <Skeleton active/>
        ) : (
            <div className={'w-[600px] max-w-full my-0 mx-auto'}>
                <Form layout={'vertical'} form={form} onFinish={onFinish}>
                    <Form.Item label={t('setting:download.provider')} name={'provider'} initialValue={defaultProvider}>
                        <Select disabled>
                            <Select.Option value={defaultProvider}>qBittorrent</Select.Option>
                        </Select>
                    </Form.Item>
                    <Form.Item label={t('setting:download.host')} name={['providers', 'qbittorrent', 'host']}>
                        <Input/>
                    </Form.Item>
                    <Form.Item label={t('setting:download.username')} name={['providers', 'qbittorrent', 'username']}>
                        <Input/>
                    </Form.Item>
                    <Form.Item label={t('setting:download.password')} name={['providers', 'qbittorrent', 'password']}>
                        <Input.Password autoComplete={'new-password'}/>
                    </Form.Item>
                    <Form.Item label={t('setting:download.transMode')} name={'trans_mode'} tooltip={t('setting:download.transModeTooltip')}>
                        <Select>
                            {TransModeOptions.map(i => (<Select.Option key={i.value}>{t(`setting:transMode.${i.value}`)}</Select.Option>))}
                        </Select>
                    </Form.Item>
                    <Form.Item label={t('setting:download.downloadPath')} name={'download_path'}
                               tooltip={t('setting:download.downloadPathTooltip')}>
                        <Input/>
                    </Form.Item>
                    <Form.Item label={t('setting:download.mappingPath')} name={'mapping_path'}>
                        <Input/>
                    </Form.Item>
                    <Form.Item label={t('setting:download.transAuto')} name={'trans_auto'} valuePropName={'checked'}
                               tooltip={t('setting:download.transAutoTooltip')}>
                        <Switch/>
                    </Form.Item>
                    <Form.Item label={t('setting:download.deleteAuto')} name={'delete_auto'} valuePropName={'checked'}
                               tooltip={t('setting:download.deleteAutoTooltip')}>
                        <Switch/>
                    </Form.Item>
                    <Form.Item label={t('setting:download.category')} name={'category'}
                               tooltip={t('setting:download.categoryTooltip')}
                    >
                        <Input placeholder={t('setting:download.categoryPlaceholder')}/>
                    </Form.Item>
                    <Form.Item label={t('setting:download.trackerSubscribe')} name={['providers', 'qbittorrent', 'tracker_subscribe']} tooltip={(
                        <span>{t('setting:download.trackerSubscribeTooltipPrefix')}
                        <a target='_blank' href={'https://trackerslist.com/'}>{t('setting:download.trackerSubscribeTooltipLink')}</a>
                    </span>)}
                    >
                        <Input placeholder={t('setting:download.trackerSubscribePlaceholder')}/>
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
