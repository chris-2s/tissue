import {Divider, Dropdown, Modal, Space, theme} from "antd";

import {
    CodeOutlined,
    EyeInvisibleOutlined,
    EyeOutlined,
    LogoutOutlined,
    MenuOutlined,
    UserOutlined
} from "@ant-design/icons";
import {useDispatch, useSelector} from "react-redux";
import {Dispatch, RootState} from "../../models";
import {themes} from "../../utils/constants";
import React, {useState} from "react";
import IconButton from "../../components/IconButton";
import Log from "./log";
import {Link} from "react-router-dom";
import Logo from "../../assets/logo.png";


const {useToken} = theme

interface Props {
    collapsible: boolean
    onCollapse: () => void
}

function Header(props: Props) {

    const {token} = useToken()
    const currentTheme = useSelector((state: RootState) => state.app.theme)
    const isGoodBoy = useSelector((state: RootState) => state.app.goodBoy)
    const appDispatch = useDispatch<Dispatch>().app
    const {userInfo} = useSelector((state: RootState) => state.auth)
    const authDispatch = useDispatch<Dispatch>().auth

    const [logOpen, setLogOpen] = useState(false)

    const theme = themes.find(i => i.name === currentTheme)!!

    function onThemeChange() {
        const themeIndex = (themes.indexOf(theme) + 1) % 2
        appDispatch.setTheme(themes[themeIndex].name)
    }

    function onGoodBoyChange() {
        appDispatch.setGoodBoy(!isGoodBoy)
    }

    const items = [
        {
            key: 'logout',
            label: '退出登录',
            icon: <LogoutOutlined/>
        }
    ] as any

    function onClick(event: any) {
        switch (event.key) {
            case 'logout':
                authDispatch.logout()
                break
        }
    }

    function renderDropdown(menu: any) {
        return (
            <div style={{
                backgroundColor: token.colorBgElevated,
                borderRadius: token.borderRadiusLG,
                boxShadow: token.boxShadowSecondary,
            }}>
                <div className={'w-36 py-2.5 px-4'}>
                    <div className={'text-base'} style={{color: token.colorText}}>{userInfo.name}</div>
                    <div className={'text-xs'} style={{color: token.colorTextSecondary}}>{userInfo.username}</div>
                </div>
                <Divider style={{margin: 0}} type={'horizontal'}/>
                {menu}
            </div>
        )
    }


    return (
        <div className={`h-full flex items-center`}>
            <div className={'cursor-pointer flex items-center'} onClick={() => props.onCollapse?.()}>
                {props.collapsible && (
                    <IconButton>
                        <MenuOutlined style={{color: token.colorText, fontSize: token.sizeMD}}/>
                    </IconButton>
                )}
                {!props.collapsible && (
                    <Link to={'/'} className={'flex items-center'}>
                        <img className={'ml-4 mr-4 h-12'} src={Logo} alt=""/>
                    </Link>
                )}
            </div>
            <div className={'flex-1 flex flex-row-reverse items-center'}>
                <Space>
                    <IconButton onClick={() => setLogOpen(true)}>
                        <CodeOutlined style={{fontSize: token.sizeLG}}/>
                    </IconButton>
                    <IconButton onClick={() => onGoodBoyChange()}>
                        {isGoodBoy ? (<EyeInvisibleOutlined style={{fontSize: token.sizeLG}}/>) : (
                            <EyeOutlined style={{fontSize: token.sizeLG}}/>)}
                    </IconButton>
                    <IconButton onClick={() => onThemeChange()}>
                        <theme.icon style={{fontSize: token.sizeLG}}/>
                    </IconButton>
                    <Dropdown arrow menu={{items, onClick}} dropdownRender={renderDropdown}>
                        <IconButton>
                            <UserOutlined style={{fontSize: token.sizeLG}}/>
                        </IconButton>
                    </Dropdown>
                </Space>
            </div>
            <Modal title={'日志'}
                   open={logOpen}
                   onCancel={() => setLogOpen(false)}
                   footer={null}
                   destroyOnClose
                   width={1000}
                   centered
            >
                <Log/>
            </Modal>
        </div>
    )
}

export default Header
