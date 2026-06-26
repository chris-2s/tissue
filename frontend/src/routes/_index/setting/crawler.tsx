import {Button, Form, InputNumber, message, Skeleton} from "antd";
import * as api from "../../../apis/setting.ts";
import {useRequest} from "ahooks";
import {createFileRoute} from "@tanstack/react-router";


export const Route = createFileRoute('/_index/setting/crawler')({
    component: SettingCrawler
})

function SettingCrawler() {

    const [form] = Form.useForm()

    const {loading} = useRequest(api.getSettings, {
        onSuccess: (res) => {
            form.setFieldsValue(res.crawler)
        }
    })

    const {run, loading: saving} = useRequest(api.saveSetting, {
        manual: true,
        onSuccess: () => {
            message.success("设置成功")
        }
    })

    function onFinish(data: any) {
        run('crawler', data)
    }

    return (
        loading ? (
            <Skeleton active />
        ) : (
            <div className={'w-[600px] max-w-full my-0 mx-auto'}>
                <Form layout={'vertical'} form={form} onFinish={onFinish}>
                    <Form.Item label={'超时时间(秒)'} name={'timeout'}>
                        <InputNumber style={{width: '100%'}}/>
                    </Form.Item>
                    <Form.Item
                        label={'订阅任务间隔(分钟)'}
                        name={'subscribe_interval_minutes'}
                        tooltip={'定时执行订阅下载任务的间隔时间。保存后会立即刷新定时任务，并按该值额外延后最多 10% 的随机时间'}
                    >
                        <InputNumber style={{width: '100%'}} min={15}/>
                    </Form.Item>
                    <Form.Item
                        label={'订阅项间隔(秒)'}
                        name={'subscribe_pause_seconds'}
                        tooltip={'同一次订阅任务中，处理完一个订阅后暂停多久再处理下一个，用于避免连续访问站点。每次暂停都会额外延后最多 10% 的随机时间'}
                    >
                        <InputNumber style={{width: '100%'}} min={1}/>
                    </Form.Item>
                    <div style={{textAlign: 'center'}}>
                        <Button type={'primary'} style={{width: 150}} loading={saving} htmlType={"submit"}>提交</Button>
                    </div>
                </Form>
            </div>
        )
    )
}
