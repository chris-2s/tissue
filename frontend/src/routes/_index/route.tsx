import {Layout, theme, Drawer, ConfigProvider, FloatButton} from "antd";
import React, {useEffect, useState} from "react";
import {useResponsive} from "ahooks";
import Styles from "./router.module.css";
import Sider from "./-components/sider.tsx";
import Header from "./-components/header.tsx";
import TabBar from "./-components/tabBar.tsx";
import useVisibility from "../../utils/useVisibility.ts";
import PinView, {PinMode} from "../../components/PinView";
import {createFileRoute, Outlet, redirect} from "@tanstack/react-router";
import {useDispatch} from "react-redux";
import {Dispatch} from "../../models";

const {useToken} = theme

export const Route = createFileRoute('/_index')({
    component: RouteLayout,
    beforeLoad: ({context}) => {
        if (!context.userToken) {
            throw redirect({
                to: '/login'
            })
        }
    }
})

function RouteLayout() {

    const responsive = useResponsive()

    const [collapsed, setCollapsed] = useState(true)
    const {token} = useToken()
    const dispatch = useDispatch<Dispatch>().auth

    const visible = useVisibility()

    useEffect(() => {
        dispatch.getInfo()
        dispatch.getVersions()
    }, [])

    useEffect(() => {
        PinView.show(PinMode.verify)
    }, [visible])

    useEffect(() => {
        document.body.style.backgroundColor = token.colorBgLayout
    }, [token.colorBgLayout])

    return (
        <div>
            <ConfigProvider theme={{
                components: {
                    Layout: {
                        headerPadding: "0 10px"
                    },
                    Menu: {
                        activeBarBorderWidth: 0,
                        itemBg: undefined,
                    }
                }
            }}>
                <Layout style={{height: '100%'}}>
                    {responsive.lg ? (
                        <Layout.Sider
                            style={{background: token.colorBgLayout, borderRightColor: token.colorBorderSecondary}}
                            className={`${Styles.side} overflow-y-auto pt-2`}>
                            <Sider showLogo={false}/>
                        </Layout.Sider>
                    ) : (
                        responsive.md && (
                            <Drawer style={{
                                width: 'calc(100% + env(safe-area-inset-left, 0))',
                                paddingLeft: 'env(safe-area-inset-left, 0)'
                            }} width={208} title={null} closeIcon={null} placement={'left'}
                                    open={!collapsed} onClose={() => setCollapsed(true)} styles={{body: {padding: 0}}}>
                                <Sider onSelect={() => setCollapsed(true)}/>
                            </Drawer>
                        )
                    )}
                    <Layout style={{position: 'relative'}}>
                        <div className={Styles.header} style={{
                            background: token.colorBgContainer + '99',
                            borderBlockEndColor: token.colorBorderSecondary
                        }}>
                            <Layout.Header className={'bg-transparent'}>
                                <Header collapsible={responsive.md && !responsive.lg}
                                        onCollapse={() => setCollapsed(!collapsed)}/>
                            </Layout.Header>
                        </div>
                        <Layout.Content
                            style={{
                                overflowY: "auto",
                                paddingBottom: (!responsive.md) ? ('calc(50px + env(safe-area-inset-bottom, 0))') : 0
                            }}
                            className={Styles.content}>
                            <div style={{padding: responsive.md ? 16 : 12}}>
                                <Outlet/>
                                <FloatButton.Group className={'index-float-button-group'}>
                                    <FloatButton.BackTop/>
                                </FloatButton.Group>
                            </div>
                        </Layout.Content>
                    </Layout>
                    {!responsive.md && (
                        <div className={Styles.footer} style={{
                            background: token.colorBgContainer + '99',
                            borderBlockStartColor: token.colorBorderSecondary
                        }}>
                            <TabBar/>
                        </div>
                    )}
                </Layout>
            </ConfigProvider>
        </div>
    )
}
