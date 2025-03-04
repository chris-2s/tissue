import {Button, Form, Input, InputNumber, message, Skeleton} from "antd";
import * as api from "../../../apis/setting.ts";
import {useRequest} from "ahooks";
import {createFileRoute} from "@tanstack/react-router";


export const Route = createFileRoute('/_index/setting/app')({
    component: SettingApp
})

function SettingApp() {

    const [form] = Form.useForm()

    const {loading} = useRequest(api.getSettings, {
        onSuccess: (res) => {
            form.setFieldsValue(res.app)
        }
    })

    const {run, loading: saving} = useRequest(api.saveSetting, {
        manual: true,
        onSuccess: () => {
            message.success("设置成功")
        }
    })

    function onFinish(data: any) {
        run('app', data)
    }

    return (
        loading ? (
            <Skeleton active />
        ) : (
            <div className={'w-[600px] max-w-full my-0 mx-auto'}>
                <Form layout={'vertical'} form={form} onFinish={onFinish}>
                    <Form.Item label={'视频路径'} name={'video_path'}>
                        <Input/>
                    </Form.Item>
                    <Form.Item label={'视频格式'} name={'video_format'}>
                        <Input/>
                    </Form.Item>
                    <Form.Item label={'视频最小容量'} name={'video_size_minimum'}>
                        <Input/>
                    </Form.Item>
                    <Form.Item label={'User Agent'} name={'user_agent'}>
                        <Input/>
                    </Form.Item>
                    <Form.Item label={'超时时间(秒)'} name={'timeout'}>
                        <InputNumber style={{width: '100%'}}/>
                    </Form.Item>
                    <div style={{textAlign: 'center'}}>
                        <Button type={'primary'} style={{width: 150}} loading={saving} htmlType={"submit"}>提交</Button>
                    </div>
                </Form>
            </div>
        )
    )
}

