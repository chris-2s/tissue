import {GetProp, Tabs, TabsProps} from "antd";
import React from "react";
import JavDB from "./javdb/index.tsx";


const tabsItems: GetProp<TabsProps, 'items'> = [
    {
        key: 'javdb',
        label: 'JavDB',
        children: (
            <JavDB/>
        )
    }
]

function Home() {
    return (
        // <Tabs size={'small'} items={tabsItems}/>
        <JavDB />
    )
}

export default Home
