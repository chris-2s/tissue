import {Layout, theme, Drawer, ConfigProvider, message, FloatButton, InputRef} from "antd";
import {Navigate, Outlet} from "react-router-dom";
import Styles from "./index.module.css";
import React, {useEffect, useRef, useState} from "react";
import {useScreen} from "../../utils/useScreen";
import Sider from "./sider";
import Header from "./header";
import {useDispatch, useSelector} from "react-redux";
import {Dispatch, RootState} from "../../models";

const {useToken} = theme

function Index() {

    const size = useScreen()
    const isLg = size.width >= 992

    const [collapsed, setCollapsed] = useState(true)
    const {token} = useToken()
    const {userToken, logging} = useSelector((state: RootState) => state.auth)
    const dispatch = useDispatch<Dispatch>().auth

    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (userToken) {
            dispatch.getInfo()
        }
    }, [])

    useEffect(() => {
        document.body.style.backgroundColor = token.colorBgLayout
    }, [token.colorBgLayout])

    if (!userToken) {
        return <Navigate to={'/login'}/>
    }


    return (
        <div className={'h-full'}>
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
                    {isLg ? (
                        <Layout.Sider
                            style={{background: token.colorBgLayout, borderRightColor: token.colorBorderSecondary}}
                            className={`${Styles.side} overflow-y-auto pt-2`}>
                            <Sider showLogo={false}/>
                        </Layout.Sider>
                    ) : (
                        <Drawer style={{
                            width: 'calc(100% + env(safe-area-inset-left))',
                            paddingLeft: 'env(safe-area-inset-left)'
                        }} width={208} title={null} closeIcon={null} placement={'left'}
                                open={!collapsed} onClose={() => setCollapsed(true)} styles={{body: {padding: 0}}}>
                            <Sider onSelect={() => setCollapsed(true)}/>
                        </Drawer>
                    )}
                    <Layout style={{position: 'relative'}}>
                        <div className={Styles.header} style={{
                            background: token.colorBgContainer + '99',
                            borderBlockEndColor: token.colorBorderSecondary
                        }}>
                            <Layout.Header className={'bg-transparent'}>
                                <Header collapsible={!isLg} onCollapse={() => setCollapsed(!collapsed)}/>
                            </Layout.Header>
                        </div>
                        <Layout.Content style={{overflowY: "auto"}}
                                        className={Styles.content} ref={contentRef}>
                            <div style={{padding: isLg ? 16 : 12}}>
                                <Outlet/>
                                <FloatButton.Group className={'index-float-button-group'}>
                                    {contentRef.current && <FloatButton.BackTop target={() => contentRef.current!!}/>}
                                </FloatButton.Group>
                            </div>
                        </Layout.Content>
                    </Layout>
                </Layout>
            </ConfigProvider>
        </div>
    )
}

export default Index
