import React from "react";
import {Badge, Rate, Space, theme, Tooltip} from "antd";
import VideoCover from "../../../../components/VideoCover";
import {SearchOutlined} from "@ant-design/icons";
import {useRouter} from "@tanstack/react-router";

const {useToken} = theme

function JavDBItem(props: { item: any }) {

    const {token} = useToken();
    const {item} = props;
    const {navigate} = useRouter()

    function render() {
        return (
            <div className="overflow-hidden rounded-lg transition-shadow hover:shadow-lg hover:border-0"
                 style={{background: token.colorBorderBg, border: `1px solid ${token.colorBorderSecondary}`}}>
                <div>
                    <VideoCover src={item.cover}/>
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
                        <div className={'mx-1'}>{item.rank}分</div>
                        <div>由{item.rank_count}人评价</div>
                    </div>
                    <div className={'flex items-center'}>
                        <div className={'flex-1'}>{item.publish_date}</div>
                        <Tooltip title={'搜索'}>
                            <div onClick={(event) => {
                                event.stopPropagation()
                                return navigate({
                                    to: '/search',
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
            <Badge.Ribbon text={'中文'}>
                {render()}
            </Badge.Ribbon>
        ) : (
            render()
        )
    )
}

export default JavDBItem
