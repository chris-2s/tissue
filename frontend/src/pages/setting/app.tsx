import {Button, Form, Input, InputNumber, message} from "antd";
import {useEffect} from "react";
import * as api from "../../apis/setting";
import {useRequest} from "ahooks";


export const TransModeOptions = [
    {name: '复制', value: 'copy', color:'blue'},
    {name: '移动', value: 'move', color:'purple'},
]

function SettingApp(props: { data?: any }) {

    useEffect(() => {
        form.setFieldsValue(props.data)
    }, [props.data])

    const [form] = Form.useForm()

    const {run, loading} = useRequest(api.saveSetting, {
        manual: true,
        onSuccess: () => {
            message.success("设置成功")
        }
    })

    function onFinish(data: any) {
        run('app', data)
    }

    return (
        <div style={{width: 600, maxWidth: '100%', margin: '0 auto'}}>
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
                    <Button type={'primary'} style={{width: 150}} loading={loading} htmlType={"submit"}>提交</Button>
                </div>
            </Form>
        </div>
    )
}

export default SettingApp
