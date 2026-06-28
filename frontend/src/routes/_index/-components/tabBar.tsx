import {CarryOutOutlined, HomeOutlined, MenuOutlined, SearchOutlined, VideoCameraOutlined} from "@ant-design/icons";
import React from "react";
import {theme} from "antd";
import {Link, useLocation} from "@tanstack/react-router";
import Styles from "./tabBar.module.css";

const {useToken} = theme

function TabBar() {

    const {token} = useToken()
    const location = useLocation()

    const menus = [
        {
            link: '/home',
            icon: <HomeOutlined/>,
            label: '首页',
        },
        {
            link: '/video',
            icon: <VideoCameraOutlined/>,
            label: '影片',
        },
        {
            link: '/subscribe',
            icon: <CarryOutOutlined/>,
            label: '订阅',
        },
        {
            link: '/search',
            icon: <SearchOutlined/>,
            label: '搜索',
        },
        {
            link: '/menu',
            icon: <MenuOutlined/>,
            label: '菜单',
        }
    ]

    return (
        <div className={Styles.bar}
             style={{marginBottom: 'env(safe-area-inset-bottom,0)'}}>
            {menus.map(item => (
                <div key={item.link} className={'text-2xl flex-1'}>
                    <Link to={item.link}
                          style={{color: location.pathname === item.link ? token.colorPrimary : token.colorText}}>
                        <div className={`${Styles.item} ${location.pathname === item.link ? Styles.itemActive : ''}`}>
                            <div className={Styles.icon}>{item.icon}</div>
                            <div className={Styles.label}>{item.label}</div>
                        </div>
                    </Link>
                </div>
            ))}
        </div>
    )
}

export default TabBar
