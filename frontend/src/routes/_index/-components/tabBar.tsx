import {CarryOutOutlined, HomeOutlined, MenuOutlined, SearchOutlined, VideoCameraOutlined} from "@ant-design/icons";
import React from "react";
import {theme} from "antd";
import {Link, useLocation} from "@tanstack/react-router";

const {useToken} = theme

function TabBar() {

    const {token} = useToken()
    const location = useLocation()

    const menus = [
        {
            link: '/home',
            icon: <HomeOutlined/>
        },
        {
            link: '/video',
            icon: <VideoCameraOutlined/>
        },
        {
            link: '/subscribe',
            icon: <CarryOutOutlined/>
        },
        {
            link: '/search',
            icon: <SearchOutlined/>
        },
        {
            link: '/menu',
            icon: <MenuOutlined/>
        }
    ]

    return (
        <div className={'flex justify-around h-12 items-center'}
             style={{marginBottom: 'env(safe-area-inset-bottom,0)'}}>
            {menus.map(item => (
                <div key={item.link} className={'text-2xl'}>
                    <Link to={item.link}
                          style={{color: location.pathname === item.link ? token.colorPrimary : token.colorText}}>
                        <div className={'px-4'}>
                            {item.icon}
                        </div>
                    </Link>
                </div>
            ))}
        </div>
    )
}

export default TabBar
