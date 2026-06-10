import React from "react";
import {PlayCircleOutlined} from "@ant-design/icons";
import Styles from "./previewImage.module.css";
import * as api from "../../../../apis/video.ts";

function PreviewImage(props: { src: string; type: string }) {
    const {src, type} = props;

    return (
        <div className={Styles.image}>
            <img src={api.getVideoCover(src)} alt=""/>
            {type === 'video' && (
                <div className={'absolute inset-0 flex items-center justify-center text-white text-2xl'}>
                    <PlayCircleOutlined/>
                </div>
            )}
        </div>
    );
}

export default PreviewImage;
