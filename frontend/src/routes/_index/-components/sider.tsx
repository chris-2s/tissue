import React from "react";
import {Menu} from "antd";
import routes from "../../../routes";
import Logo from "../../../assets/logo.png";
import {Link, useMatches, useNavigate} from "@tanstack/react-router";

interface Props {
    onSelect?: () => void
    showLogo?: boolean
}

function Sider(props: Props) {

    const {showLogo = true} = props
    const matches = useMatches()
    const selected = matches.slice(2).map((item) => {
        return item.pathname.endsWith('/') ? item.pathname.slice(0, -1) : item.pathname
    })
    const navigate = useNavigate()

    function getItem(item: any): any {
        return {
            key: item.path,
            icon: item.icon,
            label: item.title,
            type: item.type,
        }
    }

    function generateItems(routes: any) {
        return routes.filter((i: any) => i.hidden !== true).map((item: any) => {
            const menuItem = getItem(item)
            if (item.children) {
                menuItem.children = generateItems(item.children)
            }
            return menuItem
        })
    }

    return (
        <div>
            <div className={'h-16 flex items-center'} style={{marginTop: 'env(safe-area-inset-top, 0)'}}>
                {showLogo && (
                    <Link to={'/'}>
                        <img className={'ml-8 mr-4 h-12'} src={Logo} alt=""/>
                    </Link>
                )}
            </div>
            <Menu selectedKeys={selected} mode={'inline'} items={generateItems(routes)} onSelect={item => {
                props.onSelect?.()
                return navigate({to: item.key})
            }}/>
        </div>
    )
}

export default Sider
