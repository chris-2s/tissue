import React from "react";
import {DeleteOutlined, EditOutlined, MoreOutlined} from "@ant-design/icons";
import {Dropdown, theme} from "antd";
import {useTranslation} from "react-i18next";
import IconButton from "../IconButton";

const {useToken} = theme


interface Props {
    onClick: (key: string) => void
    items?: any
}

function More(props: Props) {

    const {t} = useTranslation(['common'])
    const {token} = useToken()

    const items = props.items || [
        {
            key: 'edit',
            label: t('common:actions.edit'),
            icon: <EditOutlined/>
        },
        {
            key: 'delete',
            label: t('common:actions.delete'),
            icon: <DeleteOutlined/>
        },
    ] as any

    function onClick({key}: any) {
        props.onClick(key)
    }

    return (
        <Dropdown menu={{items, onClick}}>
            <IconButton pressable={false}>
                <MoreOutlined style={{fontSize: 25, color: token.colorText}}/>
            </IconButton>
        </Dropdown>
    )
}

export default More
