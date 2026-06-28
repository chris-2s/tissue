import {Button, Card, Col, Form, Input, message, Row} from "antd";
import {useDispatch, useSelector} from "react-redux";
import {Dispatch, RootState} from "../../../../models";
import {useEffect} from "react";
import {useRequest} from "ahooks";
import * as api from "../../../../apis/user";
import {useTranslation} from "react-i18next";


function UserInfo() {
    const {t} = useTranslation(['user', 'common'])
    const [form] = Form.useForm()
    const {userInfo} = useSelector((state: RootState) => state.auth)
    const {getInfo} = useDispatch<Dispatch>().auth


    const {run: onSubmit, loading: onSubmitting} = useRequest(api.modifyUser, {
        manual: true,
        onSuccess: () => {
            getInfo()
            message.success(t('user:feedback.saved'))
        }
    })

    useEffect(() => {
        if (userInfo) {
            form.setFieldsValue(userInfo)
        }
    }, [form, userInfo])

    function onFinish(values: any) {
        if (values.password && values.password !== values.confirmPassword) {
            return message.error(t('user:validation.passwordMismatch'))
        }
        onSubmit({...values, id: userInfo.id})
    }

    return (
        <Card title={t('user:info.title')}>
            <Form form={form} layout={'vertical'} onFinish={onFinish}>
                <Row gutter={20}>
                    <Col span={24} lg={12}>
                        <Form.Item name={'name'} label={t('user:fields.name')} rules={[{required: true, message: t('user:validation.nameRequired')}]}>
                            <Input/>
                        </Form.Item>
                    </Col>
                    <Col span={24} lg={12}>
                        <Form.Item name={'username'} label={t('user:fields.username')}
                                   rules={[{required: true, message: t('user:validation.usernameRequired')}]}>
                            <Input/>
                        </Form.Item> </Col>
                    <Col span={24} lg={12}>
                        <Form.Item name={'password'} label={t('user:fields.password')}>
                            <Input.Password/>
                        </Form.Item> </Col>
                    <Col span={24} lg={12}>
                        <Form.Item name={'confirmPassword'} label={t('user:fields.confirmPassword')}>
                            <Input.Password/>
                        </Form.Item>
                    </Col>
                </Row>
                <Button type={'primary'} htmlType={'submit'} loading={onSubmitting}>{t('common:actions.save')}</Button>
            </Form>
        </Card>
    )
}

export default UserInfo
