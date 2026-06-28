import {Button, Form, Image, Input, message, Modal, Space} from "antd";
import {useRequest} from "ahooks";
import * as api from "../../../../apis/site.ts";
import React, {useState} from "react";
import {useTranslation} from "react-i18next";

interface LoginModalProps {
    siteId: number;
    siteName: string;
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface LoginFormValues {
    username: string;
    password: string;
    captcha: string;
}

function LoginModal(props: LoginModalProps) {
    const {t} = useTranslation(['site', 'common'])
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
        onError: () => {
            onClose()
        }
    })

    const {run: submitLogin, loading: logging} = useRequest(api.submitLogin, {
        manual: true,
        onSuccess: () => {
            message.success(t('site:modals.loginSuccess'))
            onSuccess()
            handleClose()
        },
        onError: () => {
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

    const handleFinish = (values: LoginFormValues) => {
        if (!loginData) {
            message.error(t('site:modals.loginExpired'))
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
            title={t('site:modals.loginTitle', {siteName})}
            onCancel={handleClose}
            footer={null}
            destroyOnHidden
        >
            <Form form={form} layout={'vertical'} onFinish={handleFinish}>
                <Form.Item label={t('site:modals.captcha')}>
                    <Space>
                        {captchaImg ? (
                            <Image src={captchaImg} height={40} preview={false} />
                        ) : (
                            <div style={{height: 40, width: 100, background: '#f0f0f0'}} />
                        )}
                        <Button size={'small'} onClick={refreshCaptcha} loading={gettingLogin}>{t('site:modals.refreshCaptcha')}</Button>
                    </Space>
                </Form.Item>
                <Form.Item name={'username'} label={t('site:modals.username')} rules={[{required: true}]}>
                    <Input placeholder={t('site:modals.usernamePlaceholder')} />
                </Form.Item>
                <Form.Item name={'password'} label={t('site:modals.password')} rules={[{required: true}]}>
                    <Input.Password placeholder={t('site:modals.passwordPlaceholder')} />
                </Form.Item>
                <Form.Item name={'captcha'} label={t('site:modals.captcha')} rules={[{required: true}]}>
                    <Input placeholder={t('site:modals.captchaPlaceholder')} />
                </Form.Item>
                <div style={{textAlign: 'center'}}>
                    <Button onClick={handleClose} style={{marginRight: 8}}>{t('common:actions.cancel')}</Button>
                    <Button type={'primary'} htmlType={'submit'} loading={logging}>{t('site:capabilities.login')}</Button>
                </div>
            </Form>
        </Modal>
    )
}

export default LoginModal
