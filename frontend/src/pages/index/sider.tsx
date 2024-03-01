import React from "react";
import {Menu, theme} from "antd";
import routes from "../../routes/routes";
import {Link, useLocation, useNavigate} from "react-router-dom";
import Logo from "../../assets/logo.png";


const {useToken} = theme

interface Props {
    onSelect?: () => void
}

function Sider(props: Props) {

    const {token} = useToken()

    const location = useLocation()
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
        return routes.map((item: any) => {
            const menuItem = getItem(item)
            if (item.children) {
                menuItem.children = generateItems(item.children)
            }
            return menuItem
        })
    }

    return (
        <div>
            <div className={'h-16 flex items-center'} style={{marginTop: 'env(safe-area-inset-top)'}}>
                <Link to={'/'}>
                    <img className={'ml-8 mr-4 h-12'} src={Logo} alt=""/>
                </Link>
            </div>
            <Menu selectedKeys={[location.pathname]} mode={'inline'} items={generateItems(routes)} onSelect={item => {
                props.onSelect?.()
                navigate(item.key)
            }}/>
        </div>
    )
}

export default Sider
