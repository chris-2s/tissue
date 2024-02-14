import {Button, Checkbox, Form, Input, message, Select, Switch} from "antd";
import {useEffect} from "react";
import * as api from "../../apis/setting";
import {useRequest} from "ahooks";
import {TransModeOptions} from "./app";


function SettingDownload(props: { data?: any }) {

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
        run('download', data)
    }

    return (
        <div style={{width: 600, maxWidth: '100%', margin: '0 auto'}}>
            <Form layout={'vertical'} form={form} onFinish={onFinish}>
                <Form.Item label={'地址(qBittorrent)'} name={'host'}>
                    <Input/>
                </Form.Item>
                <Form.Item label={'用户名'} name={'username'}>
                    <Input/>
                </Form.Item>
                <Form.Item label={'密码'} name={'password'}>
                    <Input.Password autoComplete={'new-password'}/>
                </Form.Item>
                <Form.Item label={'转移模式'} name={'trans_mode'} tooltip={'手动或自动转移使用的转移模式'}>
                    <Select>
                        {TransModeOptions.map(i => (<Select.Option key={i.value}>{i.name}</Select.Option>))}
                    </Select>
                </Form.Item>
                <Form.Item label={'下载路径'} name={'download_path'}
                           tooltip={'将下载路径对应到系统路径，解决下载器和系统下载路径不一致的问题'}>
                    <Input/>
                </Form.Item>
                <Form.Item label={'对应路径'} name={'mapping_path'}>
                    <Input/>
                </Form.Item>
                <Form.Item label={'自动转移(Beta)'} name={'trans_auto'} valuePropName={'checked'}
                           tooltip={'下载完成后是否自动转移到影片任务'}>
                    <Switch/>
                </Form.Item>
                <Form.Item label={'自动删种(Beta)'} name={'delete_auto'} valuePropName={'checked'}
                           tooltip={'整理完成后自动删除种子及数据'}>
                    <Switch/>
                </Form.Item>
                <Form.Item label={'任务分类'} name={'category'} tooltip="只有指定类别的任务会被识别，留空则为所有任务"
                >
                    <Input placeholder={'留空则为所有任务'}/>
                </Form.Item>
                <div style={{textAlign: 'center'}}>
                    <Button type={'primary'} style={{width: 150}} loading={loading} htmlType={"submit"}>提交</Button>
                </div>
            </Form>
        </div>
    )
}

export default SettingDownload
