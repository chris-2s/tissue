import {Divider, Dropdown, Modal, Space, theme} from "antd";

import {
    ArrowLeftOutlined,
    CodeOutlined,
    EyeInvisibleOutlined,
    EyeOutlined, LockOutlined,
    LogoutOutlined,
    MenuOutlined,
    UserOutlined
} from "@ant-design/icons";
import {useDispatch, useSelector} from "react-redux";
import {Dispatch, RootState} from "../../../models";
import {themes} from "../../../utils/constants";
import React, {useState} from "react";
import IconButton from "../../../components/IconButton";
import Log from "./log";
import Logo from "../../../assets/logo.png";
import {useResponsive} from "ahooks";
import PinView, {PinMode} from "../../../components/PinView";
import {Link, useRouter} from "@tanstack/react-router";


const {useToken} = theme

interface Props {
    collapsible: boolean
    onCollapse: () => void
}

function Header(props: Props) {

    const responsive = useResponsive()
    const {history} = useRouter()

    const {token} = useToken()
    const isGoodBoy = useSelector((state: RootState) => state.app.goodBoy)
    const canBack = useSelector((state: RootState) => state.app?.canBack)
    const appDispatch = useDispatch<Dispatch>().app
    const {userInfo} = useSelector((state: RootState) => state.auth)
    const authDispatch = useDispatch<Dispatch>().auth
    const [logOpen, setLogOpen] = useState(false)

    const themeMode = useSelector((state: RootState) => state.app?.themeMode)
    const CurrentTheme = themes.find(i => i.name === themeMode) || themes[0]

    function onGoodBoyChange() {
        appDispatch.setGoodBoy(!isGoodBoy)
    }

    const themeItems = themes.map(i => ({
        key: i.name,
        label: i.title,
        icon: <i.icon></i.icon>
    })) as any

    function onThemeClick(event: any) {
        appDispatch.setThemeMode(event.key)
    }

    const userItems = [
        ...[!responsive.lg && {
            key: 'pin',
            label: '设置PIN',
            icon: <LockOutlined/>
        }],
        {
            key: 'logout',
            label: '退出登录',
            icon: <LogoutOutlined/>
        }
    ] as any

    function onUserClick(event: any) {
        switch (event.key) {
            case 'pin':
                PinView.show(PinMode.setting)
                break
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
                    canBack ? (
                        <IconButton onClick={() => history.go(-1)}>
                            <ArrowLeftOutlined style={{fontSize: token.sizeLG}}/>
                        </IconButton>
                    ) : (
                        <Link to={'/'}
                              className={'flex items-center'}>
                            <img className={responsive.lg ? 'ml-4 mr-4 h-12' : 'mr-1 h-10'} src={Logo} alt=""/>
                        </Link>
                    )
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
                    <Dropdown arrow menu={{items: themeItems, onClick: onThemeClick}}>
                        <IconButton>
                            <CurrentTheme.icon style={{fontSize: token.sizeLG}}/>
                        </IconButton>
                    </Dropdown>
                    <Dropdown arrow menu={{items: userItems, onClick: onUserClick}} dropdownRender={renderDropdown}>
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
