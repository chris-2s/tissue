import {useRequest} from "ahooks";
import * as api from "../../../apis/video";
import {Card, Col, Empty, FloatButton, Row, Skeleton, Space, Tag} from "antd";
import VideoCover from "../../../components/VideoCover";
import React, {useMemo, useState} from "react";
import {createPortal} from "react-dom";
import {FilterOutlined, RedoOutlined} from "@ant-design/icons";
import VideoFilterModal, {FilterParams} from "./-components/filter.tsx";
import {createFileRoute, Link} from "@tanstack/react-router";
import VideoDetail from "../../../components/VideoDetail";

export const Route = createFileRoute('/_index/video/')({
    component: Video,
})

function Video() {

    const {data = [], loading, run ,refresh} = useRequest(api.getVideos)
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
                if (!item.title.toUpperCase().includes(filterParams.title.toUpperCase())) {
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
                <Skeleton active/>
            </Card>
        )
    }

    return (
        <Row gutter={[15, 15]}>
            {videos.length > 0 ? (
                videos.map((video: any) => (
                    <Col key={video.path} span={24} md={12} lg={6}>
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
                                                   <Tag key={actor} color={'purple'} bordered={false}>{actor.name}</Tag>
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
                        <Empty
                            description={(<span>无视频，<Link to={'/setting'} hash={'video'}>配置视频</Link></span>)}/>
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
            <VideoFilterModal open={filterOpen}
                              actors={actors}
                              initialValues={filterParams}
                              onCancel={() => setFilterOpen(false)}
                              onFilter={params => {
                                  setFilterParams(params)
                                  setFilterOpen(false)
                              }}/>
            <>
                {createPortal((
                        <>
                            <FloatButton icon={<RedoOutlined/>} onClick={() => run(true)}/>
                            <FloatButton icon={<FilterOutlined/>} type={hasFilter ? 'primary' : 'default'}
                                         onClick={() => setFilterOpen(true)}/>
                        </>
                    ), document.getElementsByClassName('index-float-button-group')[0]
                )}
            </>
        </Row>
    )
}
