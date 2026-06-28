import {queryOptions, useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import * as api from "../../../apis/video";
import {
    Card,
    Col,
    Empty,
    FloatButton,
    Pagination,
    Row,
    Space,
    Tag,
    Tooltip,
} from "antd";
import RemoteImage from "../../../components/RemoteImage";
import {IMAGE_TYPES} from "../../../constants/image";
import React, {useDeferredValue, useEffect, useMemo, useState} from "react";
import {LoadingOutlined, RedoOutlined, SearchOutlined} from "@ant-design/icons";
import {createFileRoute, Link, useRouter} from "@tanstack/react-router";
import Page from "../../../components/Page";
import RouteErrorState from "../../../components/RouteErrorState";
import RoutePendingState from "../../../components/RoutePendingState";
import VideoDetail from "../../../components/VideoDetail";
import PageFloatButtons from "../../../components/PageFloatButtons";
import type {VideoDetail as VideoItem} from "../../../types/video";
import {scrollPageToTop} from "../../../utils/scroll.ts";
import FilterPanel from "./-components/filterPanel.tsx";
import {
    formatRating,
    getVideoRatingValue,
    type VideoFilterValue,
} from "./-components/filterPanel.utils.ts";

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
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(24)
    const [filters, setFilters] = useState<VideoFilterValue>({
        tokens: [],
        zh: null,
        uncensored: null,
        ratingOperator: "gte",
        ratingValue: null,
    })
    const deferredFilters = useDeferredValue(filters)
    const {navigate} = useRouter()
    const {mutateAsync: runForceRefresh, isPending: refreshing} = useMutation({
        mutationFn: () => api.getVideos(true),
        onSuccess: (refreshedVideos) => {
            queryClient.setQueryData(['videos'], refreshedVideos)
        }
    })

    const videos = useMemo(() => {
        return data.filter((video: VideoItem) => {
            if (deferredFilters.zh === "include" && !video.is_zh) {
                return false
            }

            if (deferredFilters.zh === "exclude" && video.is_zh) {
                return false
            }

            if (deferredFilters.uncensored === "include" && !video.is_uncensored) {
                return false
            }

            if (deferredFilters.uncensored === "exclude" && video.is_uncensored) {
                return false
            }

            if (deferredFilters.ratingValue !== null) {
                const rating = getVideoRatingValue(video)
                if (rating === undefined) {
                    return false
                }
                if (deferredFilters.ratingOperator === "gte" && rating < deferredFilters.ratingValue) {
                    return false
                }
                if (deferredFilters.ratingOperator === "lte" && rating > deferredFilters.ratingValue) {
                    return false
                }
            }

            return deferredFilters.tokens.every((token) => {
                const keyword = token.value.trim().toUpperCase()
                if (!keyword) {
                    return true
                }

                if (token.kind === "num") {
                    return (video.num || "").trim().toUpperCase().includes(keyword)
                }

                if (token.kind === "actor") {
                    return video.actors.some((actor) => (actor.name || "").trim().toUpperCase().includes(keyword))
                }

                return (video.title || "").trim().toUpperCase().includes(keyword)
            })
        })
    }, [data, deferredFilters])

    useEffect(() => {
        setPage(1)
    }, [deferredFilters])

    useEffect(() => {
        const maxPage = Math.max(1, Math.ceil(videos.length / pageSize))
        if (page > maxPage) {
            setPage(maxPage)
        }
    }, [page, pageSize, videos.length])

    const pagedVideos = useMemo(() => {
        const start = (page - 1) * pageSize
        return videos.slice(start, start + pageSize)
    }, [page, pageSize, videos])

    const hasFilter = filters.tokens.length > 0 || filters.zh !== null || filters.uncensored !== null || filters.ratingValue !== null

    const floatButtons = useMemo(() => (
        <>
            <FloatButton icon={refreshing ? <LoadingOutlined/> : <RedoOutlined/>}
                         onClick={() => void runForceRefresh()}/>
        </>
    ), [refreshing, runForceRefresh])

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
            <>
                <Row gutter={[15, 15]}>
                    {pagedVideos.map((video: VideoItem) => (
                        <Col key={video.path} span={24} md={12} lg={6}>
                            <Card hoverable
                                  size={"small"}
                                  cover={(<RemoteImage src={video.fanart_path || video.cover} imageType={IMAGE_TYPES.COVER}/>)}
                                  onClick={() => setSelected(video.path)}
                            >
                                <Card.Meta title={video.title}
                                           description={(
                                               <div className={'flex'}>
                                                   <div className={'flex-1 items-center overflow-x-scroll'}
                                                        style={{scrollbarWidth: 'none'}}>
                                                       <Space size={[0, 'small']} wrap className={'flex-1'}>
                                                           {video.is_zh && (
                                                               <Tag color={'blue'} variant={'filled'}>中文</Tag>)}
                                                           {video.is_uncensored && (
                                                               <Tag color={'green'} variant={'filled'}>无码</Tag>)}
                                                           {getVideoRatingValue(video) !== undefined && (
                                                               <Tag color={'gold'} variant={'filled'}>
                                                                   {formatRating(getVideoRatingValue(video)!)}
                                                               </Tag>)}
                                                           {video.actors.map((actor: any) => (
                                                               <Tag key={actor.name} color={'purple'}
                                                                    variant={'filled'}>{actor.name}</Tag>
                                                           ))}
                                                       </Space>
                                                   </div>
                                                   <Tooltip title={'搜索'}>
                                                       <div className={'ml-1'} onClick={(event) => {
                                                           event.stopPropagation()
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

                <div className={'mt-4 flex justify-center'}>
                    <Pagination
                        current={page}
                        pageSize={pageSize}
                        total={videos.length}
                        showSizeChanger
                        pageSizeOptions={[24, 48, 96]}
                        onChange={(nextPage, nextPageSize) => {
                            setPage(nextPage)
                            setPageSize(nextPageSize)
                            scrollPageToTop()
                        }}
                    />
                </div>
            </>
        );
    } else {
        content = (
            <Row gutter={[15, 15]}>
                <Col span={24}>
                    <Card title={'视频'}>
                        <Empty
                            description={hasFilter ? '没有符合当前条件的影片' : (<span>无视频，<Link to={'/setting'} hash={'video'}>配置视频</Link></span>)}/>
                    </Card>
                </Col>
            </Row>
        );
    }

    return (
        <Page onRefresh={runForceRefresh}>
            <FilterPanel
                videos={data}
                total={data.length}
                filteredTotal={videos.length}
                value={filters}
                onChange={setFilters}
            />

            {content}
            <PageFloatButtons>{floatButtons}</PageFloatButtons>
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
        </Page>
    )
}
