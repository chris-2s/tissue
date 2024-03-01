import {Button, Checkbox, Form, Input, theme} from "antd";
import {LockOutlined, UserOutlined} from "@ant-design/icons";
import React, {useEffect} from "react";
import {useDispatch, useSelector} from "react-redux";
import {Dispatch, RootState} from "../../models";
import {Navigate} from "react-router-dom";
import Logo from "../../assets/logo.png";

const {useToken} = theme

function Login() {

    const [form] = Form.useForm()
    const {token} = useToken()
    const {userToken, logging} = useSelector((state: RootState) => state.auth)
    const {login} = useDispatch<Dispatch>().auth

    useEffect(()=>{
        document.body.style.backgroundColor = token.colorPrimaryBg
    },[token.colorPrimaryBg])

    if (userToken) {
        return <Navigate to={'/'}/>
    }

    return (
        <div className={'h-full flex flex-col justify-center items-center'} style={{background: token.colorPrimaryBg}}>
            <div className={'flex m-5'}>
                <img className={'h-20 mr-4'} src={Logo} alt=""/>
            </div>
            <div className={'w-80'}>
                <Form size={'large'} form={form} onFinish={(values) => login(values)}>
                    <Form.Item name={'username'}>
                        <Input prefix={<UserOutlined/>}/>
                    </Form.Item>
                    <Form.Item name={'password'}>
                        <Input.Password prefix={<LockOutlined/>}/>
                    </Form.Item>
                    <Form.Item noStyle name={'remember'} valuePropName={'checked'}>
                        <Checkbox style={{marginBottom: 20}}>保持登录</Checkbox>
                    </Form.Item>
                    <Button type={'primary'} style={{width: '100%'}} loading={logging}
                            htmlType={'submit'}>登录</Button>
                </Form>
                <div style={{height: 150}}/>
            </div>
        </div>
    )
}

export default Login
