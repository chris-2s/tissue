import {HTMLProps} from "react";
import {Empty} from "antd";
import Styles from "./index.module.css";

import * as api from "../../apis/video";
import {useSelector} from "react-redux";
import {RootState} from "../../models";
import {LazyLoadImage} from "react-lazy-load-image-component";


function VideoCover(props: HTMLProps<any>) {
    const {src, ...otherProps} = props
    const {goodBoy} = useSelector((state: RootState) => state.app)


    return (
        <div className={Styles.videoCoverContainer} {...otherProps}>
            {(src && goodBoy) && <div className={Styles.blur}/>}
            {src ? (
                <LazyLoadImage className={'object-contain'} src={api.getVideoCover(src)}/>
            ) : (
                <div className={'flex justify-center items-center'}>
                    <Empty description={'暂无图片'}/>
                </div>
            )}
        </div>
    )
}

export default VideoCover
