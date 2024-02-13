import {Layout, theme, Drawer, ConfigProvider, message} from "antd";
import {Navigate, Outlet} from "react-router-dom";
import Styles from "./index.module.css";
import {useEffect, useState} from "react";
import {useScreen} from "../../utils/useScreen";
import Sider from "./sider";
import Header from "./header";
import {useDispatch, useSelector} from "react-redux";
import {Dispatch, RootState} from "../../models";
import {Helmet} from "react-helmet";

const {useToken} = theme

function Index() {

    const size = useScreen()
    const isLg = size.width >= 992

    const [collapsed, setCollapsed] = useState(true)
    const {token} = useToken()
    const {userToken, logging} = useSelector((state: RootState) => state.auth)
    const dispatch = useDispatch<Dispatch>().auth

    useEffect(() => {
        if (userToken) {
            dispatch.getInfo()
        }
    }, [])

    if (!userToken) {
        return <Navigate to={'/login'}/>
    }

    return (
        <div className={Styles.container}>
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
                <Helmet>
                    <meta name="theme-color" content={token.colorBgContainer}/>
                </Helmet>
                <Layout style={{height: '100%'}}>
                    {isLg ? (
                        <Layout.Sider style={{background: token.colorBgContainer}} className={Styles.sider}>
                            <Sider/>
                        </Layout.Sider>
                    ) : (
                        <Drawer width={208} title={null} closeIcon={null} placement={'left'}
                                open={!collapsed} onClose={() => setCollapsed(true)} styles={{body: {padding: 0}}}>
                            <Sider onSelect={() => setCollapsed(true)}/>
                        </Drawer>
                    )}
                    <Layout>
                        <Layout.Header style={{background: token.colorBgContainer}} className={Styles.header}>
                            <Header collapsible={!isLg} onCollapse={() => setCollapsed(!collapsed)}/>
                        </Layout.Header>
                        <Layout.Content style={{overflowY: "scroll", background: token.colorBgLayout}}
                                        className={Styles.content}>
                            <div style={{padding: token.paddingContentVertical}}>
                                <Outlet/>
                            </div>
                        </Layout.Content>
                    </Layout>
                </Layout>
            </ConfigProvider>
        </div>
    )
}

export default Index
