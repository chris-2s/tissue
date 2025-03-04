import {GetProp, Tabs, TabsProps} from "antd";
import React from "react";
import JavDB from "./-components/javdb/index.tsx";
import {createFileRoute} from "@tanstack/react-router";


const tabsItems: GetProp<TabsProps, 'items'> = [
    {
        key: 'javdb',
        label: 'JavDB',
        children: (
            <JavDB/>
        )
    }
]

export const Route = createFileRoute('/_index/home/')({
    component: Home
})

function Home() {
    return (
        // <Tabs size={'small'} items={tabsItems}/>
        <JavDB/>
    )
}

