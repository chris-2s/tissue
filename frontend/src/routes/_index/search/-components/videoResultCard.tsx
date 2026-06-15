import {Badge, Rate, Space, Tag, theme} from "antd";
import React from "react";
import VideoCover from "../../../../components/VideoCover";
import type {VideoCandidate} from "./types";

interface VideoResultCardProps {
    item: VideoCandidate;
    onClick: () => void;
}

function VideoResultCard(props: VideoResultCardProps) {
    const {item, onClick} = props;
    const {token} = theme.useToken();

    const content = (
        <div
            className="overflow-hidden rounded-lg transition-shadow hover:shadow-lg hover:border-0 cursor-pointer"
            style={{background: token.colorBorderBg, border: `1px solid ${token.colorBorderSecondary}`}}
            onClick={onClick}
        >
            <div>
                <VideoCover src={item.cover} num={item.num}/>
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
                    <div className={'mx-1'}>{item.rank}分</div>
                    <div>由{item.rank_count}人评价</div>
                </div>
                <div className={'flex items-center'}>
                    <div className={'flex-1'}>{item.publish_date}</div>
                    <Space size={[4, 4]} wrap>
                        {item.site_names.map((siteName) => (
                            <Tag bordered={false} key={siteName}>{siteName}</Tag>
                        ))}
                    </Space>
                </div>
            </div>
        </div>
    );

    return item.isZh ? <Badge.Ribbon text={'中文'}>{content}</Badge.Ribbon> : content;
}

export default VideoResultCard;
