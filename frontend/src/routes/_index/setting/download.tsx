import {Button, Form, Input, message, Select, Skeleton, Switch} from "antd";
import * as api from "../../../apis/setting.ts";
import {useRequest} from "ahooks";
import {createFileRoute} from "@tanstack/react-router";
import {TransModeOptions} from "../../../utils/constants.ts";

export const Route = createFileRoute('/_index/setting/download')({
    component: SettingDownload
})

function SettingDownload() {

    const [form] = Form.useForm()

    const {loading} = useRequest(api.getSettings, {
        onSuccess: (res) => {
            form.setFieldsValue(res.download)
        }
    })

    const {run, loading: saving} = useRequest(api.saveSetting, {
        manual: true,
        onSuccess: () => {
            message.success("设置成功")
        }
    })

    function onFinish(data: any) {
        run('download', data)
    }

    return (
        loading ? (
            <Skeleton active/>
        ) : (
            <div className={'w-[600px] max-w-full my-0 mx-auto'}>
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
                    <Form.Item label={'任务分类'} name={'category'}
                               tooltip="只有指定类别的任务会被识别，留空则为所有任务"
                    >
                        <Input placeholder={'留空则为所有任务'}/>
                    </Form.Item>
                    <Form.Item label={'订阅Tracker'} name={'tracker_subscribe'} tooltip={(
                        <span>通过Tracker订阅链接，自动为任务添加Tracker列表。
                        <a target='_blank' href={'https://trackerslist.com/'}>示例</a>
                    </span>)}
                    >
                        <Input placeholder={'请输入Tracker订阅链接'}/>
                    </Form.Item>
                    <div style={{textAlign: 'center'}}>
                        <Button type={'primary'} style={{width: 150}} loading={saving}
                                htmlType={"submit"}>提交</Button>
                    </div>
                </Form>
            </div>
        )
    )
}
