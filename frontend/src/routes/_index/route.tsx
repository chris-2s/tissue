import {Layout, theme, Drawer, ConfigProvider, FloatButton} from "antd";
import React, {useEffect, useState} from "react";
import {useResponsive} from "ahooks";
import Styles from "./router.module.css";
import Sider from "./-components/sider.tsx";
import Header from "./-components/header.tsx";
import TabBar from "./-components/tabBar.tsx";
import useVisibility from "../../utils/useVisibility.ts";
import PinView from "../../components/PinView";
import {PinMode} from "../../components/PinView/types.ts";
import {createFileRoute, Outlet, redirect} from "@tanstack/react-router";
import {useDispatch, useSelector} from "react-redux";
import {Dispatch, RootState} from "../../models";

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
    const headerHeight = responsive.md ? 64 : 56

    const [collapsed, setCollapsed] = useState(true)
    const {token} = useToken()
    const dispatch = useDispatch<Dispatch>().auth

    const visible = useVisibility()
    const {pin, floatButtons} = useSelector((state: RootState) => state.app)
    const [pinVisible, setPinVisible] = useState(false)

    useEffect(() => {
        dispatch.getInfo()
        dispatch.getVersions()
    }, [])

    useEffect(() => {
        if (pin) {
            setPinVisible(true)
        }
    }, [visible])

    useEffect(() => {
        document.body.style.backgroundColor = token.colorBgLayout
    }, [token.colorBgLayout])

    return (
        <div style={{
            ['--page-padding-x' as string]: responsive.md ? '16px' : '12px',
            ['--page-padding-y' as string]: responsive.md ? '16px' : '12px',
            ['--page-section-gap' as string]: responsive.md ? '16px' : '14px',
            ['--page-bottom-extra' as string]: !responsive.md ? '4px' : '0px',
            ['--shell-bar-bg' as string]: `color-mix(in srgb, ${token.colorBgContainer} 72%, transparent)`,
            ['--shell-bar-shadow' as string]: `0 8px 24px color-mix(in srgb, ${token.colorBgMask} 12%, transparent)`,
        }}>
            <ConfigProvider theme={{
                components: {
                    Layout: {
                        headerPadding: "0 10px"
                    },
                    Menu: {
                        activeBarBorderWidth: 0,
                        itemBg: undefined,
                    },
                    Rate: {
                        starSize: 15
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
                            borderBlockEndColor: token.colorBorderSecondary
                        }}>
                            <Layout.Header
                                className={'bg-transparent flex items-center'}
                                style={{height: headerHeight}}
                            >
                                <Header collapsible={responsive.md && !responsive.lg}
                                        onCollapse={() => setCollapsed(!collapsed)}/>
                            </Layout.Header>
                        </div>
                        <Layout.Content
                            style={{
                                paddingBottom: (!responsive.md) ? ('calc(56px + env(safe-area-inset-bottom, 0))') : 0,
                                paddingTop: `calc(env(safe-area-inset-top, 0) + ${headerHeight}px)`,
                            }}
                            className={Styles.content}>
                            <div className={Styles.contentInner}>
                                <Outlet/>
                                <FloatButton.Group className={'index-float-button-group'}>
                                    {floatButtons}
                                    <FloatButton.BackTop/>
                                </FloatButton.Group>
                            </div>
                        </Layout.Content>
                    </Layout>
                    {!responsive.md && (
                        <div className={Styles.footer} style={{
                            borderBlockStartColor: token.colorBorderSecondary
                        }}>
                            <TabBar/>
                        </div>
                    )}
                </Layout>
                {pinVisible && (
                    <PinView pin={pin} mode={PinMode.verify} onClose={() => setPinVisible(false)}/>
                )}
            </ConfigProvider>
        </div>
    )
}
