import {queryOptions, useQuery, useQueryClient} from "@tanstack/react-query";
import {useRequest} from "ahooks";
import * as api from "../../../apis/video";
import {Card, Col, Empty, FloatButton, Row, Space, Tag, Tooltip} from "antd";
import VideoCover from "../../../components/VideoCover";
import React, {useMemo, useState} from "react";
import {createPortal} from "react-dom";
import {FilterOutlined, LoadingOutlined, RedoOutlined, SearchOutlined} from "@ant-design/icons";
import VideoFilterModal, {FilterParams} from "./-components/filter.tsx";
import {createFileRoute, Link, useRouter} from "@tanstack/react-router";
import RouteErrorState from "../../../components/RouteErrorState";
import RoutePendingState from "../../../components/RoutePendingState";
import VideoDetail from "../../../components/VideoDetail";

export const Route = createFileRoute('/_index/video/')({
    component: Video,
})

function videosQueryOptions() {
    return queryOptions({
        queryKey: ['videos'] as const,
        staleTime: 30 * 1000,
        gcTime: 5 * 60 * 1000,
        retry: 1,
        queryFn: () => api.getVideos()
    });
}

function Video() {

    const queryClient = useQueryClient()
    const {data = [], isPending, isError, refetch} = useQuery(videosQueryOptions())
    const [selected, setSelected] = useState<string | undefined>()
    const [filterOpen, setFilterOpen] = useState(false)
    const [filterParams, setFilterParams] = useState<FilterParams>({})
    const {navigate} = useRouter()
    const floatButtonGroup = document.getElementsByClassName('index-float-button-group')[0]
    const {run: runForceRefresh, loading: refreshing} = useRequest(() => api.getVideos(true), {
        manual: true,
        onSuccess: (refreshedVideos) => {
            queryClient.setQueryData(['videos'], refreshedVideos)
        }
    })

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

    let content: React.ReactNode;

    if (isPending) {
        content = <RoutePendingState/>;
    } else if (isError) {
        content = (
            <RouteErrorState
                title={'视频列表加载失败'}
                description={'请检查网络后重试'}
                onRetry={async () => {
                    await refetch();
                }}
            />
        );
    } else if (videos.length > 0) {
        content = (
            <Row gutter={[15, 15]}>
                {videos.map((video: any) => (
                    <Col key={video.path} span={24} md={12} lg={6}>
                        <Card hoverable
                              size={"small"}
                              cover={(<VideoCover src={video.cover}/>)}
                              onClick={() => setSelected(video.path)}
                        >
                            <Card.Meta title={video.title}
                                       description={(
                                           <div className={'flex'}>
                                               <div className={'flex-1 items-center overflow-x-scroll'}
                                                    style={{scrollbarWidth: 'none'}}>
                                                   <Space size={[0, 'small']} className={'flex-1'}>
                                                       {video.is_zh && (
                                                           <Tag color={'blue'} bordered={false}>中文</Tag>)}
                                                       {video.is_uncensored && (
                                                           <Tag color={'green'} bordered={false}>无码</Tag>)}
                                                       {video.actors.map((actor: any) => (
                                                           <Tag key={actor.name} color={'purple'}
                                                                bordered={false}>{actor.name}</Tag>
                                                       ))}
                                                   </Space>
                                               </div>
                                               <Tooltip title={'搜索'}>
                                                   <div className={'ml-1'} onClick={() => {
                                                       return navigate({
                                                           to: '/home/detail',
                                                           search: {num: video.num}
                                                       })
                                                   }}>
                                                       <SearchOutlined/>
                                                   </div>
                                               </Tooltip>
                                           </div>
                                       )}
                            />
                        </Card>
                    </Col>
                ))}
            </Row>
        );
    } else {
        content = (
            <Row gutter={[15, 15]}>
                <Col span={24}>
                    <Card title={'视频'}>
                        <Empty
                            description={(<span>无视频，<Link to={'/setting'} hash={'video'}>配置视频</Link></span>)}/>
                    </Card>
                </Col>
            </Row>
        );
    }

    return (
        <>
            {content}
            <VideoDetail title={'编辑'}
                         mode={'video'}
                         width={1100}
                         path={selected}
                         open={!!selected}
                         onCancel={() => setSelected(undefined)}
                          onOk={() => {
                             setSelected(undefined)
                             queryClient.invalidateQueries({queryKey: ['videos']})
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
            {floatButtonGroup && createPortal((
                    <>
                        <FloatButton icon={refreshing ? <LoadingOutlined/> : <RedoOutlined/>}
                                     onClick={() => runForceRefresh()}/>
                        <FloatButton icon={<FilterOutlined/>} type={hasFilter ? 'primary' : 'default'}
                                     onClick={() => setFilterOpen(true)}/>
                    </>
                ), floatButtonGroup
            )}
        </>
    )
}
