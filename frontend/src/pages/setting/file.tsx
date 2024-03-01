import {Button, Form, Input, message, Select} from "antd";
import {useEffect} from "react";
import * as api from "../../apis/setting";
import {useRequest} from "ahooks";
import {TransModeOptions} from "./app";


function SettingFile(props: { data?: any }) {

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
        run('file', data)
    }

    return (
        <div className={'w-[600px] max-w-full my-0 mx-auto'}>
            <Form layout={'vertical'} form={form} onFinish={onFinish}>
                <Form.Item label={'文件路径'} name={'path'}>
                    <Input/>
                </Form.Item>
                <Form.Item label={'转移模式'} name={'trans_mode'}>
                    <Select>
                        {TransModeOptions.map(i => (<Select.Option key={i.value}>{i.name}</Select.Option>))}
                    </Select>
                </Form.Item>
                <div style={{textAlign: 'center'}}>
                    <Button type={'primary'} style={{width: 150}} loading={loading} htmlType={"submit"}>提交</Button>
                </div>
            </Form>
        </div>
    )
}

export default SettingFile
