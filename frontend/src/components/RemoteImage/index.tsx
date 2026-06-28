import React, {HTMLProps, useMemo} from "react";
import {Avatar, Empty, Tag, Tooltip} from "antd";
import Styles from "./index.module.css";

import * as api from "../../apis/video";
import type {ImageType} from "../../constants/image";
import {useSelector} from "react-redux";
import {RootState} from "../../models";
import {LazyLoadImage} from "react-lazy-load-image-component";
import {UnorderedListOutlined, UserOutlined} from "@ant-design/icons";
import {useTranslation} from "react-i18next";

interface Props extends HTMLProps<any> {
    num?: string
    avatar?: boolean
    imageType: ImageType
}

function RemoteImage(props: Props) {
    const {t} = useTranslation(['common', 'video'])
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
            {libraryMatched && (
                <div>
                    <Tooltip title={(
                        <div>
                            {libraryMatched.is_zh && (
                                <Tag color={'blue'} variant={'filled'}>{t('video:library.zh')}</Tag>)}
                            {libraryMatched.is_uncensored && (
                                <Tag color={'green'} variant={'filled'}>{t('video:library.uncensored')}</Tag>)}
                        </div>
                    )}>
                        <Tag icon={<UnorderedListOutlined/>} className={Styles.library}>
                            {t('video:library.inLibrary')}
                        </Tag>
                    </Tooltip>
                </div>
            )}
        </div>
    )
}

export default RemoteImage
