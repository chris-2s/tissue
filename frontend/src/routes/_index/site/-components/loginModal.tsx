import {Button, Form, Image, Input, message, Modal, Space} from "antd";
import {useRequest} from "ahooks";
import * as api from "../../../../apis/site.ts";
import React, {useState} from "react";

interface LoginModalProps {
    siteId: number;
    siteName: string;
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

function LoginModal(props: LoginModalProps) {
    const {siteId, siteName, open, onClose, onSuccess} = props

    const [form] = Form.useForm()
    const [captchaImg, setCaptchaImg] = useState<string>('')
    const [loginData, setLoginData] = useState<{cookies: string, authenticity_token: string} | null>(null)

    const {run: getLoginPage, loading: gettingLogin} = useRequest(api.getLoginPage, {
        manual: true,
        onSuccess: (res) => {
            const response = res.data.data
            setLoginData({
                cookies: response.cookies,
                authenticity_token: response.authenticity_token
            })
            setCaptchaImg(`data:image/png;base64,${response.captcha}`)
        },
        onError: (e) => {
            onClose()
        }
    })

    const {run: submitLogin, loading: logging} = useRequest(api.submitLogin, {
        manual: true,
        onSuccess: () => {
            message.success('登录成功')
            onSuccess()
            handleClose()
        },
        onError: (e) => {
            getLoginPage(siteId)
        }
    })

    React.useEffect(() => {
        if (open) {
            getLoginPage(siteId)
            form.resetFields()
        }
    }, [open])

    const handleClose = () => {
        setLoginData(null)
        setCaptchaImg('')
        onClose()
    }

    const handleFinish = (values: any) => {
        if (!loginData) {
            message.error('登录信息已过期，请重新打开')
            return
        }
        submitLogin(siteId, {
            cookies: loginData.cookies,
            authenticity_token: loginData.authenticity_token,
            username: values.username,
            password: values.password,
            captcha: values.captcha
        })
    }

    const refreshCaptcha = () => {
        getLoginPage(siteId)
    }

    return (
        <Modal
            open={open}
            title={`登录 ${siteName}`}
            onCancel={handleClose}
            footer={null}
            destroyOnClose
        >
            <Form form={form} layout={'vertical'} onFinish={handleFinish}>
                <Form.Item label={'验证码'}>
                    <Space>
                        {captchaImg ? (
                            <Image src={captchaImg} height={40} preview={false} />
                        ) : (
                            <div style={{height: 40, width: 100, background: '#f0f0f0'}} />
                        )}
                        <Button size={'small'} onClick={refreshCaptcha} loading={gettingLogin}>换一张</Button>
                    </Space>
                </Form.Item>
                <Form.Item name={'username'} label={'账号'} rules={[{required: true}]}>
                    <Input placeholder={'请输入账号'} />
                </Form.Item>
                <Form.Item name={'password'} label={'密码'} rules={[{required: true}]}>
                    <Input.Password placeholder={'请输入密码'} />
                </Form.Item>
                <Form.Item name={'captcha'} label={'验证码'} rules={[{required: true}]}>
                    <Input placeholder={'请输入验证码'} />
                </Form.Item>
                <div style={{textAlign: 'center'}}>
                    <Button onClick={handleClose} style={{marginRight: 8}}>取消</Button>
                    <Button type={'primary'} htmlType={'submit'} loading={logging}>登录</Button>
                </div>
            </Form>
        </Modal>
    )
}

export default LoginModal
