import {CarryOutOutlined, HomeOutlined, MenuOutlined, SearchOutlined, VideoCameraOutlined} from "@ant-design/icons";
import React from "react";
import {theme} from "antd";
import {Link, useLocation} from "@tanstack/react-router";
import {useTranslation} from "react-i18next";
import Styles from "./tabBar.module.css";

const {useToken} = theme

function TabBar() {

    const {token} = useToken()
    const location = useLocation()
    const {t} = useTranslation('routes')

    const menus = [
        {
            link: '/home',
            icon: <HomeOutlined/>,
            label: t('routes:home'),
        },
        {
            link: '/video',
            icon: <VideoCameraOutlined/>,
            label: t('routes:video'),
        },
        {
            link: '/subscribe',
            icon: <CarryOutOutlined/>,
            label: t('routes:subscribe'),
        },
        {
            link: '/search',
            icon: <SearchOutlined/>,
            label: t('routes:search'),
        },
        {
            link: '/menu',
            icon: <MenuOutlined/>,
            label: t('routes:menu'),
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
