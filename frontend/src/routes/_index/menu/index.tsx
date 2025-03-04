import routes from "../../../routes.tsx";
import {Card, Divider, theme} from "antd";
import {useResponsive} from "ahooks";
import React from "react";
import {createFileRoute, Link, Navigate} from "@tanstack/react-router";

const {useToken} = theme

export const Route = createFileRoute('/_index/menu/')({
    component: Menu,
})

function Menu() {

    const {token} = useToken();
    const responsive = useResponsive()

    function renderMenuSection() {
        return routes.filter(i => i.hidden !== true).map(item => (
            <div key={item.title}>
                <Divider>{item.title}</Divider>
                <div className={'flex justify-center'}>
                    {item.children ? (
                        item.children.map((child: any) => (renderMenu(child)))
                    ) : (
                        renderMenu(item)
                    )}
                </div>
            </div>
        ))
    }

    function renderMenu(menu: any) {
        return (
            <Link key={menu.path} to={menu.path} style={{color: token.colorText}}>
                <div className={'px-4 py-2 flex flex-col items-center'}>
                    <div className={'text-4xl'}>
                        {menu.icon}
                    </div>
                    <div className={'mt-2'}>
                        {menu.title}
                    </div>
                </div>
            </Link>
        )
    }

    if (responsive.md) {
        return <Navigate to={'/'}/>
    }

    return (
        <Card>
            {renderMenuSection()}
        </Card>
    )
}
