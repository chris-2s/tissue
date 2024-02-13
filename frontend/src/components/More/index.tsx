import React from "react";
import {DeleteOutlined, EditOutlined, MoreOutlined} from "@ant-design/icons";
import {Dropdown, theme} from "antd";
import IconButton from "../IconButton";

const {useToken} = theme


interface Props {
    onClick: (key: string) => void
    items?: any
}

function More(props: Props) {

    const {token} = useToken()

    const items = props.items || [
        {
            key: 'edit',
            label: '编辑',
            icon: <EditOutlined/>
        },
        {
            key: 'delete',
            label: '删除',
            icon: <DeleteOutlined/>
        },
    ] as any

    function onClick({key}: any) {
        props.onClick(key)
    }

    return (
        <Dropdown menu={{items, onClick}}>
            <IconButton>
                <MoreOutlined style={{fontSize: 25, color: token.colorText}}/>
            </IconButton>
        </Dropdown>
    )
}

export default More
