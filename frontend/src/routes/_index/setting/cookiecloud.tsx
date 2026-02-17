import {Button, Form, Input, message, Skeleton, Switch} from "antd";
import * as api from "../../../apis/setting";
import {useRequest} from "ahooks";
import {createFileRoute} from "@tanstack/react-router";


export const Route = createFileRoute('/_index/setting/cookiecloud')({
    component: SettingCookieCloud
})

function SettingCookieCloud() {

    const [form] = Form.useForm()

    const {loading} = useRequest(api.getSettings, {
        onSuccess: (res) => {
            form.setFieldsValue(res.cookiecloud)
        }
    })

    const {run, loading: saving} = useRequest(api.saveSetting, {
        manual: true,
        onSuccess: () => {
            message.success("设置成功")
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
                    <Form.Item label={'启用'} name={'enabled'} valuePropName={'checked'}>
                        <Switch/>
                    </Form.Item>
                    <Form.Item label={'服务器地址'} name={'host'}>
                        <Input placeholder={'https://ccc.ft07.com'}/>
                    </Form.Item>
                    <Form.Item label={'UUID'} name={'uuid'}>
                        <Input placeholder={'你的 UUID'}/>
                    </Form.Item>
                    <Form.Item label={'密码'} name={'password'}>
                        <Input.Password placeholder={'你的密码'}/>
                    </Form.Item>
                    <div style={{textAlign: 'center'}}>
                        <Button type={'primary'} style={{width: 150}} loading={saving} htmlType={"submit"}>提交</Button>
                    </div>
                </Form>
            </div>
        )
    )
}
