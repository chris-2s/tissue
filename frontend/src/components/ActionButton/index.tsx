import {Button} from "antd";
import type {ButtonProps} from "antd";
import Styles from "./index.module.css";

function ActionButton(props: ButtonProps) {
    const {
        className,
        size = 'small',
        type = 'text',
        ...otherProps
    } = props

    return (
        <Button
            {...otherProps}
            className={[Styles.button, className].filter(Boolean).join(' ')}
            size={size}
            type={type}
        />
    )
}

export default ActionButton
