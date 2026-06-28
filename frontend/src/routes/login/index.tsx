import {Button, Checkbox, Form, Input, theme} from "antd";
import {LockOutlined, UserOutlined} from "@ant-design/icons";
import React, {useEffect} from "react";
import {useTheme} from "ahooks";
import {useDispatch, useSelector} from "react-redux";
import {Dispatch, RootState} from "../../models";
import Logo from "../../assets/logo.png";
import {createFileRoute, redirect} from "@tanstack/react-router";
import Styles from "./index.module.css";

const {useToken} = theme

export const Route = createFileRoute('/login/')({
    component: Login,
    beforeLoad: ({context}) => {
        if (context.userToken) {
            throw redirect({
                to: '/'
            })
        }
    }
})

function Login() {

    const [form] = Form.useForm()
    const {token} = useToken()
    const themeMode = useSelector((state: RootState) => state.app.themeMode)
    const {theme: systemTheme} = useTheme()
    const {logging, versions} = useSelector((state: RootState) => state.auth)
    const authDispatch = useDispatch<Dispatch>().auth

    useEffect(() => {
        document.body.style.backgroundColor = token.colorBgLayout

        void authDispatch.getVersions().catch(() => undefined)
    }, [authDispatch, token.colorBgLayout])

    const isDark = themeMode === 'dark' || (themeMode === 'system' && systemTheme === 'dark')

    return (
        <div
            className={Styles.page}
            style={{
                ['--login-bg-start' as string]: isDark
                    ? `color-mix(in srgb, ${token.colorBgLayout} 90%, #0f172a 10%)`
                    : `color-mix(in srgb, ${token.colorBgLayout} 90%, white 10%)`,
                ['--login-bg-end' as string]: isDark
                    ? `color-mix(in srgb, ${token.colorBgLayout} 86%, ${token.colorBgContainer} 14%)`
                    : `color-mix(in srgb, ${token.colorBgLayout} 84%, ${token.colorBgContainer} 16%)`,
                ['--login-glow-strong' as string]: `color-mix(in srgb, ${token.colorPrimary} ${isDark ? 22 : 18}%, transparent)`,
                ['--login-glow-soft' as string]: `color-mix(in srgb, ${token.colorInfo || token.colorPrimary} ${isDark ? 18 : 14}%, transparent)`,
                ['--login-glow-deep' as string]: `color-mix(in srgb, ${token.colorPrimaryActive || token.colorPrimary} ${isDark ? 16 : 12}%, transparent)`,
                ['--login-grid-line' as string]: isDark
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'rgba(255, 255, 255, 0.4)',
                ['--login-panel-bg' as string]: isDark
                    ? 'rgba(20, 24, 34, 0.56)'
                    : 'rgba(255, 255, 255, 0.6)',
                ['--login-panel-border' as string]: isDark
                    ? 'rgba(255, 255, 255, 0.12)'
                    : 'rgba(255, 255, 255, 0.78)',
                ['--login-panel-highlight' as string]: isDark
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'rgba(255, 255, 255, 0.42)',
                ['--login-panel-shadow' as string]: isDark
                    ? 'rgba(0, 0, 0, 0.22)'
                    : 'rgba(36, 77, 152, 0.12)',
                ['--login-title' as string]: token.colorTextHeading,
                ['--login-version-text' as string]: token.colorTextSecondary,
                ['--login-version-badge-bg' as string]: isDark
                    ? `color-mix(in srgb, ${token.colorPrimaryBg} 68%, transparent)`
                    : 'rgba(255, 255, 255, 0.72)',
                ['--login-version-badge-text' as string]: token.colorPrimary,
            }}
        >
            <section className={Styles.panel}>
                <div className={Styles.brand}>
                    <img src={Logo} alt="Tissue"/>
                </div>
                <h1 className={Styles.title}>登录</h1>
                <Form className={Styles.form} size={'large'} form={form} onFinish={(values) => authDispatch.login(values)}>
                    <Form.Item name={'username'}>
                        <Input prefix={<UserOutlined/>} placeholder={'用户名'}/>
                    </Form.Item>
                    <Form.Item name={'password'}>
                        <Input.Password prefix={<LockOutlined/>} placeholder={'密码'}/>
                    </Form.Item>
                    <div className={Styles.remember}>
                        <Form.Item noStyle name={'remember'} valuePropName={'checked'}>
                            <Checkbox>保持登录</Checkbox>
                        </Form.Item>
                    </div>
                    <Button className={Styles.submit} type={'primary'} style={{width: '100%', background: token.colorPrimary}} loading={logging}
                            htmlType={'submit'}>登录</Button>
                </Form>
                <div className={Styles.version}>
                    {versions?.current ? <span>当前版本 {versions.current}</span> : <span>版本信息加载中</span>}
                    {versions?.hasNew && <span className={Styles.versionBadge}>新版本 {versions.latest}</span>}
                </div>
            </section>
        </div>
    )
}
