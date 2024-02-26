import {HTMLProps} from "react";
import {Empty} from "antd";
import Styles from "./index.module.css";

import * as api from "../../apis/video";
import {useDebounce} from "ahooks";
import {useSelector} from "react-redux";
import {RootState} from "../../models";


function VideoCover(props: HTMLProps<any>) {
    const {src, ...otherProps} = props
    const {goodBoy} = useSelector((state: RootState) => state.app)


    return (
        <div className={Styles.videoCoverContainer} {...otherProps}>
            {(src && goodBoy) && <div className={Styles.blur}/>}
            {src ? (
                <img {...otherProps} src={api.getVideoCover(src)}/>
            ) : (
                <div style={{display: "flex", alignItems: "center", justifyContent: 'center'}}>
                    <Empty description={'暂无图片'}/>
                </div>
            )}
        </div>
    )
}

export default VideoCover
