import {useRequest} from "ahooks";
import * as api from "../../apis/video";
import {Card, Col, Empty, FloatButton, Modal, Row, Skeleton, Space, Tag} from "antd";
import VideoCover from "../../components/VideoCover";
import React, {useMemo, useState} from "react";
import VideoDetail from "./detail";
import {Link} from "react-router-dom";
import {createPortal} from "react-dom";
import {FilterOutlined} from "@ant-design/icons";
import VideoFilterModal, {FilterParams} from "./filter.tsx";


function Video() {

    const {data = [], loading, refresh} = useRequest(api.getVideos, {})
    const [selected, setSelected] = useState<string | undefined>()
    const [filterOpen, setFilterOpen] = useState(false)
    const [filterParams, setFilterParams] = useState<FilterParams>({})

    const actors = useMemo(() => {
        const actors: any[] = []
        data.forEach((video: any) => {
            video.actors.forEach((actor: any) => {
                const exist = actors.find(i => i.name == actor.name)
                if (exist) {
                    exist.count = exist.count + 1
                } else {
                    actor.count = 1
                    actors.push(actor)
                }
            })
        })
        return actors
    }, [data])

    const videos = useMemo(() => {
        return data.filter((item: any) => {
            if (filterParams.title) {
                if (!item.title.includes(filterParams.title)) {
                    return false
                }
            }
            if (filterParams.actors?.length) {
                return item.actors.map((i: any) => i.name).filter((i: string) => filterParams.actors?.includes(i)).length > 0
            }
            return true
        })
    }, [filterParams, data])

    const hasFilter = !!filterParams.title || !!filterParams.actors?.length

    if (loading) {
        return (
            <Card>
                <Skeleton loading/>
            </Card>
        )
    }

    return (
        <Row gutter={[15, 15]}>
            {videos.length > 0 ? (
                videos.map((video: any) => (
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
                                               {video.actors.map((actor: any) => (
                                                   <Tag color={'purple'} bordered={false}>{actor.name}</Tag>
                                               ))}
                                           </Space>
                                       )}
                            />
                        </Card>
                    </Col>
                ))
            ) : (
                <Col span={24}>
                    <Card title={'视频'}>
                        <Empty description={(<span>无视频，<Link to={'/setting#app'}>配置视频</Link></span>)}/>
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
            <VideoFilterModal open={filterOpen} onCancel={() => setFilterOpen(false)}
                              actors={actors}
                              onFilter={params => {
                                  setFilterParams(params)
                                  setFilterOpen(false)
                              }}/>
            <>
                {createPortal((
                        <FloatButton icon={<FilterOutlined/>} type={hasFilter ? 'primary' : 'default'}
                                     onClick={() => setFilterOpen(true)}/>),
                    document.getElementsByClassName('index-float-button-group')[0]
                )}
            </>
        </Row>
    )
}

export default Video
