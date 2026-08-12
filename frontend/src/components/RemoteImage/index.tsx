import React, {HTMLProps, useMemo} from "react";
import {Avatar, Empty, Tag, Tooltip} from "antd";
import Styles from "./index.module.css";

import * as api from "../../apis/video";
import type {ImageType} from "../../constants/image";
import {useSelector} from "react-redux";
import {RootState} from "../../models";
import {LazyLoadImage} from "react-lazy-load-image-component";
import {CheckOutlined, UserOutlined} from "@ant-design/icons";
import {useTranslation} from "react-i18next";

interface Props extends HTMLProps<any> {
    videoNumber?: string
    isZh?: boolean
    isUncensored?: boolean
    avatar?: boolean
    imageType: ImageType
}

function RemoteImage(props: Props) {
    const {t} = useTranslation(['common', 'video'])
    const {
        src,
        videoNumber,
        isZh = false,
        isUncensored = false,
        avatar = false,
        className,
        imageType,
        ...otherProps
    } = props
    const {goodBoy} = useSelector((state: RootState) => state.app)
    const videos = useSelector((state: RootState) => state.auth?.videos)

    const libraryMatched = useMemo(() => {
        if (!videoNumber) return undefined
        return videos?.find(i=>i.num?.toUpperCase() === videoNumber.toUpperCase())
    }, [videos, videoNumber])

    return (
        <div
            className={`${Styles.videoCoverContainer} ${avatar ? Styles.avatar : ''} ${className || ''}`.trim()}
            {...otherProps}
        >
            {(src && goodBoy) && <div className={Styles.blur}/>}
            {src ? (
                <LazyLoadImage className={avatar ? 'h-full w-full object-cover' : 'object-contain'} src={api.getImageUrl(src, imageType)}/>
            ) : avatar ? (
                <div className={Styles.avatarPlaceholder}>
                    <Avatar
                        icon={<UserOutlined/>}
                        size={'large'}
                        style={{width: '100%', height: '100%'}}
                    />
                </div>
            ) : (
                <div className={'flex justify-center items-center'}>
                    <Empty description={t('common:state.noImage')}/>
                </div>
            )}
            {!avatar && (isZh || isUncensored) && (
                <div className={Styles.badges}>
                    {isZh && <span className={`${Styles.badge} ${Styles.zhBadge}`}>{t('video:library.zh')}</span>}
                    {isUncensored && (
                        <span className={`${Styles.badge} ${Styles.uncensoredBadge}`}>
                            {t('video:library.uncensored')}
                        </span>
                    )}
                </div>
            )}
            {libraryMatched && (
                <div className={Styles.libraryStatus}>
                    <Tooltip title={(
                        <div>
                            {libraryMatched.is_zh && (
                                <Tag color={'blue'} variant={'filled'}>{t('video:library.zh')}</Tag>)}
                            {libraryMatched.is_uncensored && (
                                <Tag color={'green'} variant={'filled'}>{t('video:library.uncensored')}</Tag>)}
                        </div>
                    )}>
                        <span className={Styles.libraryPill}>
                            <CheckOutlined/>
                            {t('video:library.inLibrary')}
                        </span>
                    </Tooltip>
                </div>
            )}
        </div>
    )
}

export default RemoteImage
