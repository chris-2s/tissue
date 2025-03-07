import React from "react";
import {Badge, Rate, Space, theme} from "antd";
import VideoCover from "../../../../components/VideoCover";

const {useToken} = theme

function JavDBItem(props: { item: any }) {

    const {token} = useToken();
    const {item} = props;

    function render() {
        return (
            <div className="overflow-hidden rounded-lg transition-shadow hover:shadow-lg hover:border-0"
                 style={{background: token.colorBorderBg, border: `1px solid ${token.colorBorderSecondary}`}}>
                <div>
                    <VideoCover src={item.cover}/>
                </div>
                <div className={'p-3'}>
                    <div className={'text-nowrap overflow-y-scroll text-lg'} style={{scrollbarWidth: 'none'}}>
                        {item.num} {item.title}
                    </div>
                    <Space className={'my-2'}>
                        <Rate disabled allowHalf value={item.rank}></Rate>
                        <div>{item.rank}分</div>
                        <div>由 {item.rank_count} 人评价</div>
                    </Space>
                    <div>{item.publish_date}</div>
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
