import React, {HTMLProps, useMemo} from "react";
import {Avatar, Empty, Tag, Tooltip} from "antd";
import Styles from "./index.module.css";

import * as api from "../../apis/video";
import type {ImageType} from "../../constants/image";
import {useSelector} from "react-redux";
import {RootState} from "../../models";
import {LazyLoadImage} from "react-lazy-load-image-component";
import {CarryOutOutlined, CheckOutlined, UserOutlined} from "@ant-design/icons";
import {useTranslation} from "react-i18next";

interface Props extends HTMLProps<any> {
    videoNumber?: string
    isZh?: boolean
    isUncensored?: boolean
    avatar?: boolean
    imageType: ImageType
}

function RemoteImage(props: Props) {
    const {t} = useTranslation(['common', 'video', 'subscribe'])
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
    const subscribes = useSelector((state: RootState) => state.auth?.subscribes)

    const libraryMatched = useMemo(() => {
        if (!videoNumber) return undefined
        return videos?.find(i=>i.num?.toUpperCase() === videoNumber.toUpperCase())
    }, [videos, videoNumber])

    const subscriptionMatches = useMemo(() => {
        if (!videoNumber) return []
        return subscribes.filter((item) => item.num?.toUpperCase() === videoNumber.toUpperCase())
    }, [subscribes, videoNumber])

    const coverBadges = [
        isZh && {
            key: 'zh',
            className: Styles.zhBadge,
            label: t('video:library.zh'),
        },
        isUncensored && {
            key: 'uncensored',
            className: Styles.uncensoredBadge,
            label: t('video:library.uncensored'),
        },
    ].filter(Boolean) as {key: string, className: string, label: string}[]

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
            {!avatar && coverBadges.length > 0 && (
                <div className={Styles.badges}>
                    {coverBadges.map((badge) => (
                        <span key={badge.key} className={`${Styles.badge} ${badge.className}`}>
                            {badge.label}
                        </span>
                    ))}
                </div>
            )}
            {(libraryMatched || subscriptionMatches.length > 0) && (
                <div className={Styles.statusStack} onClick={(event) => event.stopPropagation()}>
                    {libraryMatched && (
                        <Tooltip trigger={['hover', 'click']} title={(
                            <div>
                                {libraryMatched.is_zh && (
                                    <Tag color={'blue'} variant={'filled'}>{t('video:library.zh')}</Tag>)}
                                {libraryMatched.is_uncensored && (
                                    <Tag color={'green'} variant={'filled'}>{t('video:library.uncensored')}</Tag>)}
                            </div>
                        )}>
                            <span className={Styles.statusPill}>
                                <CheckOutlined/>
                                {t('video:library.inLibrary')}
                            </span>
                        </Tooltip>
                    )}
                    {subscriptionMatches.length > 0 && (
                        <Tooltip trigger={['hover', 'click']} title={(
                            <div className={Styles.subscriptionDetails}>
                                {subscriptionMatches.map((subscription) => {
                                    const hasSpecification = subscription.is_hd || subscription.is_zh || subscription.is_uncensored
                                    return (
                                        <div key={subscription.id} className={Styles.subscriptionSpecification}>
                                            {subscription.is_hd && (
                                                <Tag color={'red'} variant={'filled'}>{t('subscribe:flags.hd')}</Tag>)}
                                            {subscription.is_zh && (
                                                <Tag color={'blue'} variant={'filled'}>{t('subscribe:flags.zh')}</Tag>)}
                                            {subscription.is_uncensored && (
                                                <Tag color={'green'} variant={'filled'}>{t('subscribe:flags.uncensored')}</Tag>)}
                                            {!hasSpecification && <Tag>{t('video:library.anySpecification')}</Tag>}
                                        </div>
                                    )
                                })}
                            </div>
                        )}>
                            <span className={Styles.statusPill}>
                                <CarryOutOutlined/>
                                {t('video:library.subscribed')}
                            </span>
                        </Tooltip>
                    )}
                </div>
            )}
        </div>
    )
}

export default RemoteImage
