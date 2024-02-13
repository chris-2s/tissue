import {HTMLProps} from "react";
import {Empty} from "antd";
import Styles from "./index.module.css";

import * as api from "../../apis/video";
import {useDebounce} from "ahooks";


function VideoCover(props: HTMLProps<any>) {
    const {src, ...otherProps} = props

    return (
        <div className={Styles.videoCoverContainer} {...otherProps}>
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
