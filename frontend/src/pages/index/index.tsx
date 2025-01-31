import {Layout, theme, Drawer, ConfigProvider, FloatButton} from "antd";
import {Navigate, Outlet} from "react-router-dom";
import Styles from "./index.module.css";
import React, {useEffect, useRef, useState} from "react";
import Sider from "./sider";
import Header from "./header";
import {useDispatch, useSelector} from "react-redux";
import {Dispatch, RootState} from "../../models";
import {useResponsive} from "ahooks";
import TabBar from "./tabBar.tsx";

const {useToken} = theme

function Index() {

    const responsive = useResponsive()

    const [collapsed, setCollapsed] = useState(true)
    const {token} = useToken()
    const {userToken, logging} = useSelector((state: RootState) => state.auth)
    const dispatch = useDispatch<Dispatch>().auth

    useEffect(() => {
        if (userToken) {
            dispatch.getInfo()
            dispatch.getVersions()
        }
    }, [])

    useEffect(() => {
        document.body.style.backgroundColor = token.colorBgLayout
    }, [token.colorBgLayout])

    if (!userToken) {
        return <Navigate to={'/login'}/>
    }


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
                                paddingBottom: (!responsive.md && !responsive.lg) ? ('calc(50px + env(safe-area-inset-bottom, 0))') : 0
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
                    {(!responsive.md && !responsive.lg) && (
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

export default Index
