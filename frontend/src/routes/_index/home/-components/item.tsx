import React from "react";
import {Badge, Rate, theme, Tooltip} from "antd";
import RemoteImage from "../../../../components/RemoteImage";
import {IMAGE_TYPES} from "../../../../constants/image";
import {SearchOutlined} from "@ant-design/icons";
import {useRouter} from "@tanstack/react-router";
import type {SiteVideo} from "../../../../types/video";
import {useTranslation} from "react-i18next";

const {useToken} = theme

function VideoItem(props: { item: SiteVideo }) {
    const {t} = useTranslation(['home']);
    const {token} = useToken();
    const {item} = props;
    const {navigate} = useRouter()

    function render() {
        return (
            <div className="overflow-hidden rounded-lg transition-shadow hover:shadow-lg hover:border-0"
                 style={{background: token.colorBorderBg, border: `1px solid ${token.colorBorderSecondary}`}}>
                <div>
                    <RemoteImage src={item.cover} num={item.num} imageType={IMAGE_TYPES.COVER}/>
                </div>
                <div className={'p-3'}>
                    <div className={'text-nowrap overflow-y-scroll'} style={{
                        scrollbarWidth: 'none',
                        fontSize: token.fontSizeHeading5,
                        fontWeight: token.fontWeightStrong
                    }}>
                        {item.num} {item.title}
                    </div>
                    <div className={'flex items-center my-2'}>
                        <Rate disabled allowHalf value={item.rank}></Rate>
                        <div className={'mx-1'}>{item.rank}{t('home:item.scoreUnit')}</div>
                        <div>{t('home:item.ratedBy', {count: item.rank_count || 0})}</div>
                    </div>
                    <div className={'flex items-center'}>
                        <div className={'flex-1'}>{item.publish_date}</div>
                        <Tooltip title={t('home:item.search')}>
                            <div onClick={(event) => {
                                event.stopPropagation()
                                return navigate({
                                    to: '/home/detail',
                                    search: {num: item.num}
                                })
                            }}>
                                <SearchOutlined/>
                            </div>
                        </Tooltip>
                    </div>
                </div>
            </div>
        )
    }

    return (
        item.isZh ? (
            <Badge.Ribbon text={t('home:item.zhRibbon')}>
                {render()}
            </Badge.Ribbon>
        ) : (
            render()
        )
    )
}

export default VideoItem
