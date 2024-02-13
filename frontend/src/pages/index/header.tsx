import {Divider, Dropdown, Space, theme} from "antd";

import {LogoutOutlined, MenuOutlined, UserOutlined} from "@ant-design/icons";
import Styles from "./header.module.css";
import IconFont from "../../components/IconFont";
import {useDispatch, useSelector} from "react-redux";
import {Dispatch, RootState} from "../../models";
import {themes} from "../../utils/constants";
import React from "react";
import IconButton from "../../components/IconButton";


const {useToken} = theme

interface Props {
    collapsible: boolean
    onCollapse: () => void
}

function Header(props: Props) {

    const {token} = useToken()
    const currentTheme = useSelector((state: RootState) => state.app.theme)
    const appDispatch = useDispatch<Dispatch>().app
    const {userInfo} = useSelector((state: RootState) => state.auth)
    const authDispatch = useDispatch<Dispatch>().auth

    function onThemeChange() {
        const themeIndex = (themes.findIndex(i => i.name === currentTheme) + 1) % 2
        appDispatch.setTheme(themes[themeIndex].name)
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
                <div className={Styles.userContainer}>
                    <div style={{color: token.colorText}}>{userInfo.name}</div>
                    <div style={{color: token.colorTextSecondary}}>{userInfo.username}</div>
                </div>
                <Divider style={{margin: 0}} type={'horizontal'}/>
                {menu}
            </div>
        )
    }

    return (
        <div className={Styles.container}>
            <div className={Styles.trigger} onClick={() => props.onCollapse?.()}>
                {props.collapsible && (
                    <IconButton>
                        <MenuOutlined style={{color: token.colorText, fontSize: token.sizeMD}}/>
                    </IconButton>
                )}
            </div>
            <div className={Styles.toolbar}>
                <Space>
                    <IconButton onClick={() => onThemeChange()}>
                        <IconFont type={themes.find(i => i.name === currentTheme)!!.icon}
                                  style={{fontSize: token.sizeLG}}/>
                    </IconButton>
                    <Dropdown arrow menu={{items, onClick}} dropdownRender={renderDropdown}>
                        <IconButton>
                            <UserOutlined style={{fontSize: token.sizeLG}}/>
                        </IconButton>
                    </Dropdown>
                </Space>
            </div>
        </div>
    )
}

export default Header
