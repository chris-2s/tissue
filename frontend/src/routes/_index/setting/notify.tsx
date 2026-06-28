import {Button, Form, message, Select, Skeleton} from "antd";
import {useRequest} from "ahooks";
import * as api from "../../../apis/setting.ts";
import Telegram from "./-component/telegram.tsx";
import Webhook from "./-component/webhook.tsx";
import {createFileRoute} from "@tanstack/react-router";

const notifications = [
    {name: 'Telegram', value: 'telegram', element: Telegram},
    {name: 'Webhook', value: 'webhook', element: Webhook},
]

export const Route = createFileRoute('/_index/setting/notify')({
    component: SettingNotify
})

function SettingNotify() {

    const [form] = Form.useForm()

    const provider = Form.useWatch('provider', form)

    const {loading} = useRequest(api.getSettings, {
        onSuccess: (res) => {
            form.setFieldsValue({
                provider: 'telegram',
                providers: {
                    telegram: {token: '', chat_id: ''},
                    webhook: {url: ''},
                },
                ...res.notify,
            })
        }
    })

    const {run, loading: saving} = useRequest(api.saveSetting, {
        manual: true,
        onSuccess: () => {
            message.success("设置成功")
        }
    })

    function onFinish(data: any) {
        data.provider = data.provider || 'telegram'
        run('notify', data)
    }

    const ItemElement = notifications.find(item => item.value === provider)?.element

    return (
        loading ? (
            <Skeleton active/>
        ) : (
            <div className={'w-[600px] max-w-full my-0 mx-auto'}>
                <Form layout={'vertical'} form={form} onFinish={onFinish}>
                    <Form.Item name={'provider'} label={'类型'} initialValue={'telegram'}>
                        <Select>
                            {notifications.map(item => (
                                <Select.Option key={item.value} value={item.value}>{item.name}</Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    {ItemElement && (<ItemElement/>)}
                    <div style={{textAlign: 'center'}}>
                        <Button type={'primary'} style={{width: 150}} loading={saving}
                                htmlType={"submit"}>提交</Button>
                    </div>
                </Form>
            </div>
        )
    )
}
