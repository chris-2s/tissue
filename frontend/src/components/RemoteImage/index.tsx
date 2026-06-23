import React, {HTMLProps, useMemo} from "react";
import {Empty, Tag, Tooltip} from "antd";
import Styles from "./index.module.css";

import * as api from "../../apis/video";
import type {ImageType} from "../../constants/image";
import {useSelector} from "react-redux";
import {RootState} from "../../models";
import {LazyLoadImage} from "react-lazy-load-image-component";
import {UnorderedListOutlined} from "@ant-design/icons";

interface Props extends HTMLProps<any> {
    num?: string
    avatar?: boolean
    imageType: ImageType
}

function RemoteImage(props: Props) {
    const {src, num = undefined, avatar = false, className, imageType, ...otherProps} = props
    const {goodBoy} = useSelector((state: RootState) => state.app)
    const videos = useSelector((state: RootState) => state.auth?.videos)

    const libraryMatched = useMemo(() => {
        if (!num) return undefined
        return videos?.find(i=>i.num?.toUpperCase() === num.toUpperCase())
    }, [videos, num])

    return (
        <div
            className={`${Styles.videoCoverContainer} ${avatar ? Styles.avatar : ''} ${className || ''}`.trim()}
            {...otherProps}
        >
            {(src && goodBoy) && <div className={Styles.blur}/>}
            {src ? (
                <LazyLoadImage className={avatar ? 'h-full w-full object-cover' : 'object-contain'} src={api.getImageUrl(src, imageType)}/>
            ) : (
                <div className={'flex justify-center items-center'}>
                    <Empty description={'暂无图片'}/>
                </div>
            )}
            {libraryMatched && (
                <div>
                    <Tooltip title={(
                        <div>
                            {libraryMatched.is_zh && (
                                <Tag color={'blue'} variant={'filled'}>中文</Tag>)}
                            {libraryMatched.is_uncensored && (
                                <Tag color={'green'} variant={'filled'}>无码</Tag>)}
                        </div>
                    )}>
                        <Tag icon={<UnorderedListOutlined/>} className={Styles.library}>
                            已入库
                        </Tag>
                    </Tooltip>
                </div>
            )}
        </div>
    )
}

export default RemoteImage
