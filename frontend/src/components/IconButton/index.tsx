import {CSSProperties, ComponentPropsWithoutRef, forwardRef} from "react";
import {theme} from "antd";

type IconButtonProps = ComponentPropsWithoutRef<'span'>

const hoverStyle = {'--hover-bg': 'transparent'} as CSSProperties

const IconButton = forwardRef<HTMLSpanElement, IconButtonProps>(function IconButton(props, ref) {
    const {children, className, style, ...otherProps} = props
    const {token} = theme.useToken()

    return (
        <span
            ref={ref}
            {...otherProps}
            style={{...hoverStyle, '--hover-bg': token.colorBgTextHover, ...style} as CSSProperties}
            className={[
                'relative inline-flex justify-center items-center p-2 rounded-3xl cursor-pointer hover:bg-[var(--hover-bg)]',
                className
            ].filter(Boolean).join(' ')}
        >
            {children}
        </span>
    )
})

export default IconButton
