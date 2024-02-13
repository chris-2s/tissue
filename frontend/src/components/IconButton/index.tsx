import {ComponentProps} from "react";
import Styles from "./index.module.css";
import {useSelector} from "react-redux";
import {RootState} from "../../models";


function IconButton(props: ComponentProps<any>) {

    const {children, ...otherProps} = props
    const currentTheme = useSelector((state: RootState) => state.app.theme)


    return (
        <span {...otherProps}>
            <span
                className={[Styles.container, currentTheme === 'dark' ? Styles.triggerDark : Styles.triggerLight].join(" ")}>
                {children}
            </span>
        </span>
    )
}

export default IconButton
