import {ComponentProps, ReactNode} from "react";
import {theme} from "antd";

function IconButton(props: ComponentProps<any>) {

    const {children, badge, ...otherProps} = props
    const {token} = theme.useToken()

    return (
        <span {...otherProps}>
            <span style={{'--hover-bg': token.colorBgTextHover} as any}
                  className={'relative flex justify-center items-center p-2 rounded-3xl cursor-pointer ' +
                      'hover:bg-[var(--hover-bg)]'}>
                {children}
            </span>
        </span>
    )
}

export default IconButton
