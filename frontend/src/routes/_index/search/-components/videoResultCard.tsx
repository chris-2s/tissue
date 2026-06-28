import {Badge, Rate, Space, Tag, theme} from "antd";
import React from "react";
import RemoteImage from "../../../../components/RemoteImage";
import {IMAGE_TYPES} from "../../../../constants/image";
import type {VideoCandidate} from "./types";
import {useTranslation} from "react-i18next";

interface VideoResultCardProps {
    item: VideoCandidate;
    onClick: () => void;
}

function VideoResultCard(props: VideoResultCardProps) {
    const {t} = useTranslation(['search']);
    const {item, onClick} = props;
    const {token} = theme.useToken();

    const content = (
        <div
            className="overflow-hidden rounded-lg transition-shadow hover:shadow-lg hover:border-0 cursor-pointer"
            style={{background: token.colorBorderBg, border: `1px solid ${token.colorBorderSecondary}`}}
            onClick={onClick}
        >
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
                    <Rate disabled allowHalf value={item.rank}/>
                    <div className={'mx-1'}>{item.rank}{t('search:card.scoreUnit')}</div>
                    <div>{t('search:card.ratedBy', {count: item.rank_count})}</div>
                </div>
                <div className={'flex items-center'}>
                    <div className={'flex-1'}>{item.publish_date}</div>
                    <Space size={[4, 4]} wrap>
                        {item.site_names.map((siteName) => (
                            <Tag variant={'filled'} key={siteName}>{siteName}</Tag>
                        ))}
                    </Space>
                </div>
            </div>
        </div>
    );

    return item.isZh ? <Badge.Ribbon text={t('search:card.zhRibbon')}>{content}</Badge.Ribbon> : content;
}

export default VideoResultCard;
