import {Button, Form, Input, message, Select, Skeleton} from "antd";
import * as api from "../../../apis/setting.ts";
import {useRequest} from "ahooks";
import {createFileRoute} from "@tanstack/react-router";
import {TransModeOptions} from "../../../utils/constants.ts";


export const Route = createFileRoute('/_index/setting/file')({
    component: SettingFile
})

function SettingFile(props: { data?: any }) {

    const [form] = Form.useForm()

    const {loading} = useRequest(api.getSettings, {
        onSuccess: (res) => {
            form.setFieldsValue(res.file)
        }
    })

    const {run, loading: saving} = useRequest(api.saveSetting, {
        manual: true,
        onSuccess: () => {
            message.success("设置成功")
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
                    <Form.Item label={'文件路径'} name={'path'}>
                        <Input/>
                    </Form.Item>
                    <Form.Item label={'转移模式'} name={'trans_mode'}>
                        <Select>
                            {TransModeOptions.map(i => (<Select.Option key={i.value}>{i.name}</Select.Option>))}
                        </Select>
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

