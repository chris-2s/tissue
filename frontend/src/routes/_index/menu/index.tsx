import routes from "../../../routes.tsx";
import {Card, theme} from "antd";
import {useResponsive} from "ahooks";
import React from "react";
import {createFileRoute, Link, Navigate, useLocation} from "@tanstack/react-router";
import Styles from "./menu.module.css";

const {useToken} = theme

export const Route = createFileRoute('/_index/menu/')({
    component: Menu,
})

function Menu() {

    const {token} = useToken();
    const responsive = useResponsive()
    const location = useLocation()

    function renderMenuSection() {
        return routes.filter(i => i.hidden !== true).map((item: any) => {
            const children = item.children || [item]

            return (
                <section key={item.title} className={Styles.section}>
                    <div className={Styles.sectionHeader}>
                        <div className={Styles.sectionTitle} style={{color: token.colorTextHeading}}>
                            {item.title}
                        </div>
                    </div>
                    <div className={Styles.grid}>
                        {children.map((child: any) => renderMenu(child))}
                    </div>
                </section>
            )
        })
    }

    function renderMenu(menu: any) {
        const active = location.pathname === menu.path

        return (
            <Link key={menu.path} to={menu.path} className={Styles.item} style={{color: token.colorText}}>
                <div className={`${Styles.tile} ${active ? Styles.tileActive : ''}`}>
                    <div className={Styles.iconWrap} style={{color: active ? token.colorPrimary : token.colorText}}>
                        {menu.icon}
                    </div>
                    <div className={Styles.label}>
                        <div className={Styles.title} style={{color: active ? token.colorPrimary : token.colorText}}>
                            {menu.title}
                        </div>
                    </div>
                </div>
            </Link>
        )
    }

    if (responsive.md) {
        return <Navigate to={'/'}/>
    }

    return (
        <Card bodyStyle={{padding: 16}}>
            <div className={Styles.page}>
                {renderMenuSection()}
            </div>
        </Card>
    )
}
