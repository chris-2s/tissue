import {useEffect} from "react";
import {Button, Form, Input, message, Select, Switch} from "antd";
import {useRequest} from "ahooks";
import * as api from "../../apis/setting";
import Telegram from "./component/telegram";
import Webhook from "./component/webhook";

const notifications = [
    {name: 'Telegram', value: 'telegram', element: Telegram},
    {name: 'Webhook', value: 'webhook', element: Webhook},
]

function SettingNotify(props: { data?: any }) {

    useEffect(() => {
        form.setFieldsValue(props.data)
    }, [props.data])

    const [form] = Form.useForm()

    const type = Form.useWatch('type', form)

    const {run, loading} = useRequest(api.saveSetting, {
        manual: true,
        onSuccess: () => {
            message.success("设置成功")
        }
    })

    function onFinish(data: any) {
        run('notify', data)
    }

    const ItemElement = notifications.find(item => item.value === type)?.element

    return (
        <div className={'w-[600px] max-w-full my-0 mx-auto'}>
            <Form layout={'vertical'} form={form} onFinish={onFinish}>
                <Form.Item name={'type'} label={'类型'} initialValue={'telegram'}>
                    <Select>
                        {notifications.map(item => (
                            <Select.Option key={item.value} value={item.value}>{item.name}</Select.Option>
                        ))}
                    </Select>
                </Form.Item>
                {ItemElement && (<ItemElement />)}
                <div style={{textAlign: 'center'}}>
                    <Button type={'primary'} style={{width: 150}} loading={loading} htmlType={"submit"}>提交</Button>
                </div>
            </Form>
        </div>
    )
}

export default SettingNotify
