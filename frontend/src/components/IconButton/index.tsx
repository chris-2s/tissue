import {CSSProperties, ComponentPropsWithoutRef, forwardRef} from "react";
import {theme} from "antd";
import Styles from "./index.module.css";

type IconButtonProps = ComponentPropsWithoutRef<'button'> & {
    selected?: boolean
    size?: 'sm' | 'md' | 'lg'
    pressable?: boolean
}

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(props, ref) {
    const {children, className, style, selected = false, size = 'md', pressable = true, type = 'button', ...otherProps} = props
    const {token} = theme.useToken()

    return (
        <button
            ref={ref}
            type={type}
            {...otherProps}
            style={{
                '--icon-button-hover-bg': token.colorFillSecondary,
                '--icon-button-active-bg': token.colorFill,
                '--icon-button-selected-bg': token.colorPrimaryBg,
                '--icon-button-selected-color': token.colorPrimary,
                ...style
            } as CSSProperties}
            className={[
                Styles.button,
                Styles[size],
                !pressable && Styles.buttonNoPress,
                selected && Styles.buttonSelected,
                className
            ].filter(Boolean).join(' ')}
        >
            {children}
        </button>
    )
})

export default IconButton
