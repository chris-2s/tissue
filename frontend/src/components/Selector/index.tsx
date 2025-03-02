import React from "react";
import {theme} from "antd";

interface SelectorItem {
    name: string
    value: string
}

interface SelectorProps extends React.ComponentProps<any> {
    items: SelectorItem[]
    value?: string
    onChange?: (value: string) => void
}

const {useToken} = theme

function Selector(props: SelectorProps) {

    const {items, value, onChange, ...others} = props
    const {token} = useToken()

    function renderItem(item: SelectorItem) {
        return (
            <div key={item.value} className={'mr-2 px-4 py-1 cursor-pointer'}
                 onClick={() => {
                     if (item.value !== props.value) {
                         onChange?.(item.value)
                     }
                 }}
                 style={{
                     background: item.value == value ? token.colorPrimaryBgHover : token.colorBgTextActive,
                     color: item.value == value ? token.colorPrimary : token.colorText
                 }}>
                {item.name}
            </div>
        )
    }

    return (
        <div {...others} className={'flex'}>
            {items.map(item => renderItem(item))}
        </div>
    )
}

export default Selector
