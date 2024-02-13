import {useRequest} from "ahooks";
import * as api from "../../apis/video";
import {Card, Col, Empty, Row, Skeleton, Space, Tag} from "antd";
import VideoCover from "../../components/VideoCover";
import React, {useState} from "react";
import VideoDetail from "./detail";
import {Link} from "react-router-dom";


function Video() {

    const {data = [], loading, refresh} = useRequest(api.getVideos, {})
    const [selected, setSelected] = useState<string | undefined>()

    if (loading) {
        return (
            <Card>
                <Skeleton loading/>
            </Card>
        )
    }

    return (
        <Row gutter={[15, 15]}>
            {data.length > 0 ? (
                data.map((video: any) => (
                    <Col key={video.path} span={24} lg={6}>
                        <Card hoverable
                              cover={(<VideoCover src={video.cover}/>)}
                              onClick={() => setSelected(video.path)}
                        >
                            <Card.Meta title={video.title}
                                       description={(
                                           <Space size={[0, 'small']} wrap>
                                               {video.is_zh && (<Tag color={'blue'} bordered={false}>中文</Tag>)}
                                               {video.is_uncensored && (
                                                   <Tag color={'green'} bordered={false}>无码</Tag>)}
                                           </Space>
                                       )}
                            />
                        </Card>
                    </Col>
                ))
            ) : (
                <Col span={24}>
                    <Card>
                        <Empty description={(<span>暂无视频，<Link to={'/setting#app'}>配置视频</Link></span>)}/>
                    </Card>
                </Col>
            )}

            <VideoDetail title={'编辑'}
                         mode={'video'}
                         width={1100}
                         path={selected}
                         open={!!selected}
                         onCancel={() => setSelected(undefined)}
                         onOk={() => {
                             setSelected(undefined)
                             refresh()
                         }}
            />
        </Row>
    )
}

export default Video
