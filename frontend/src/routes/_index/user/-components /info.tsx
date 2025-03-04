import {Button, Card, Col, Form, Input, message, Row} from "antd";
import {useDispatch, useSelector} from "react-redux";
import {Dispatch, RootState} from "../../../../models";
import {useEffect} from "react";
import {useRequest} from "ahooks";
import * as api from "../../../../apis/user";


function UserInfo() {

    const [form] = Form.useForm()
    const {userInfo} = useSelector((state: RootState) => state.auth)
    const {getInfo} = useDispatch<Dispatch>().auth


    const {run: onSubmit, loading: onSubmitting} = useRequest(api.modifyUser, {
        manual: true,
        onSuccess: () => {
            getInfo()
            message.success('保存成功')
        }
    })

    useEffect(() => {
        if (userInfo) {
            form.setFieldsValue(userInfo)
        }
    }, [userInfo])

    function onFinish(values: any) {
        if (values.password && values.password !== values.confirmPassword) {
            return message.error("两次输入密码不一致")
        }
        onSubmit({...values, id: userInfo.id})
    }

    return (
        <Card title={'用户信息'}>
            <Form form={form} layout={'vertical'} onFinish={onFinish}>
                <Row gutter={20}>
                    <Col span={24} lg={12}>
                        <Form.Item name={'name'} label={'名称'} rules={[{required: true, message: '请输入名称'}]}>
                            <Input/>
                        </Form.Item>
                    </Col>
                    <Col span={24} lg={12}>
                        <Form.Item name={'username'} label={'用户名'}
                                   rules={[{required: true, message: '请输入用户名'}]}>
                            <Input/>
                        </Form.Item> </Col>
                    <Col span={24} lg={12}>
                        <Form.Item name={'password'} label={'新密码'}>
                            <Input.Password/>
                        </Form.Item> </Col>
                    <Col span={24} lg={12}>
                        <Form.Item name={'confirmPassword'} label={'确认新密码'}>
                            <Input.Password/>
                        </Form.Item>
                    </Col>
                </Row>
                <Button type={'primary'} htmlType={'submit'} loading={onSubmitting}>保存</Button>
            </Form>
        </Card>
    )
}

export default UserInfo
