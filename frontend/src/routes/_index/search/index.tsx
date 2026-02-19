import {
    Button,
    Card,
    Col,
    Descriptions,
    Empty,
    Input,
    List,
    message,
    Row, Segmented, Skeleton,
    Space,
    Tag,
    Tooltip
} from "antd";
import React, {useEffect, useState} from "react";
import {
    CarryOutOutlined,
    CloudDownloadOutlined,
    CopyOutlined,
    HistoryOutlined,
    RedoOutlined,
    SearchOutlined
} from "@ant-design/icons";
import * as api from "../../../apis/subscribe";
import {useRequest, useResponsive} from "ahooks";
import {useFormModal} from "../../../utils/useFormModal.ts";
import Websites from "../../../components/Websites";
import VideoCover from "../../../components/VideoCover";
import SubscribeModifyModal from "../subscribe/-components/modifyModal.tsx";
import {
    createFileRoute,
    useSearch,
    useLoaderData,
    useRouter, useMatch
} from "@tanstack/react-router";
import Await from "../../../components/Await";
import {useDispatch} from "react-redux";
import {Dispatch} from "../../../models";
import Preview from "./-components/preview.tsx";
import DownloadModal from "./-components/downloadModal.tsx";
import HistoryModal from "./-components/historyModal.tsx";
import Comment from "./-components/comment.tsx";
import ActorsModal from "./-components/actorsModal.tsx";
import type {VideoDetail, VideoDownload} from "../../../types/video.ts";

const cacheHistoryKey = 'search_video_histories'

type SearchRouteSearch = {
    num?: string;
    site_id?: number;
    url?: string;
};

type SearchHistory = {
    num: string;
    actors: string;
    title?: string;
    cover?: string;
};

type SearchVideoView = Omit<VideoDetail, 'actors'> & { actors: string };

export const Route = createFileRoute('/_index/search/')({
    component: Search,
    loaderDeps: ({search}) => search as SearchRouteSearch,
    loader: ({deps}) => {
        return {
            data: deps.num ? (
                api.searchVideo({num: deps.num}).then(data => {
                    const res: SearchVideoView = {
                        ...data,
                        actors: data.actors.map((i: { name?: string }) => i.name).filter(Boolean).join(", "),
                    }
                    const histories: SearchHistory[] = JSON.parse(localStorage.getItem(cacheHistoryKey) || '[]')
                        .filter((i: SearchHistory) => i.num.toUpperCase() !== (res.num || '').toUpperCase())
                    const history = {num: res.num, actors: res.actors, title: res.title, cover: res.cover}
                    localStorage.setItem(cacheHistoryKey, JSON.stringify([history, ...histories.slice(0, 19)]))
                    return res
                }).catch((err) => {

                })
            ) : (
                Promise.resolve()
            )
        }
    },
    staleTime: Infinity
})


export function Search() {

    const router = useRouter()

    const detailMatch = useMatch({from: '/_index/home/detail', shouldThrow: false})
    const routeId = detailMatch ? '/_index/home/detail' : '/_index/search/'
    const search = useSearch({from: routeId}) as SearchRouteSearch
    const {data: loaderData} = useLoaderData({from: routeId}) as { data: Promise<SearchVideoView | undefined> }

    const appDispatch = useDispatch<Dispatch>().app
    const responsive = useResponsive()
    const [searchInput, setSearchInput] = useState((!detailMatch ? search?.num : '') || '')
    const [filter, setFilter] = useState({isHd: false, isZh: false, isUncensored: false})
    const [previewSelected, setPreviewSelected] = useState<number>()
    const [commentSelected, setCommentSelected] = useState<number>()

    const [selectedVideo, setSelectedVideo] = useState<SearchVideoView>()
    const [selectedDownload, setSelectedDownload] = useState<VideoDownload>()
    const [historyModalOpen, setHistoryModalOpen] = useState(false)
    const [actorsModalOpen, setActorsModalOpen] = useState(false)

    useEffect(() => {
        appDispatch.setCanBack(!!detailMatch)
        return () => {
            appDispatch.setCanBack(false)
        }
    }, [detailMatch])

    const {setOpen: setSubscribeOpen, modalProps: subscribeModalProps} = useFormModal({
        service: api.modifySubscribe,
        onOk: () => {
            setSubscribeOpen(false)
            return message.success("订阅添加成功")
        }
    })

    const {run: onDownload, loading: onDownloading} = useRequest(api.downloadVideos, {
        manual: true,
        onSuccess: () => {
            setSelectedVideo(undefined)
            setSelectedDownload(undefined)
            return message.success("下载任务创建成功")
        }
    })

    function renderItems(video: SearchVideoView) {
        return [
            {
                key: 'actors',
                label: '演员',
                span: 24,
                children: video.actors && (
                    <div className={'cursor-pointer'} onClick={() => setActorsModalOpen(true)}>
                        <span>{video.actors}</span>
                        <span className={'ml-1'}><SearchOutlined/></span>
                    </div>
                ),
            },
            {
                key: 'num',
                label: '番号',
                span: 8,
                children: video.num,
            },
            {
                key: 'premiered',
                label: '发布日期',
                span: 8,
                children: video.premiered,
            },
            {
                key: 'rating',
                label: '评分',
                span: 8,
                children: video.rating,
            },
            {
                key: 'title',
                label: '标题',
                span: 24,
                children: video.title,
            },
            {
                key: 'outline-solid',
                label: '大纲',
                span: 24,
                children: (
                    <span className={'whitespace-pre-wrap'}>{video.outline}</span>
                ),
            },
            {
                key: 'studio',
                label: '制造商',
                span: 8,
                children: video.studio,
            },
            {
                key: 'publisher',
                label: '发行商',
                span: 8,
                children: video.publisher,
            },
            {
                key: 'director',
                label: '导演',
                span: 8,
                children: video.director,
            },
            {
                key: 'tags',
                label: '类别',
                span: 24,
                children: (
                    <div className={'leading-7'}>
                        {video.tags.map((i) => (
                            <Tag key={i}>{i}</Tag>
                        ))}
                    </div>
                ),
            },
            {
                key: 'series',
                label: '系列',
                span: 16,
                children: video.series,
            },
            {
                key: 'runtime',
                label: '时长',
                span: 8,
                children: video.runtime,
            },
            {
                key: 'websites',
                label: '网站',
                span: 24,
                children: (
                    <Websites value={video.website} readonly/>
                ),
            },
        ]
    }

    function onCopyClick(item: VideoDownload) {
        const textarea = document.createElement('textarea');
        textarea.value = item.magnet || '';
        textarea.style.position = 'fixed';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        return message.success("磁力链接已复制")
    }

    return (
        <Row gutter={[15, 15]}>
            <Col span={24} lg={8} md={12}>
                <Card>
                    {!detailMatch && (
                        <div className={'flex'}>
                            <Input.Search placeholder={'请输入番号'} enterButton
                                          value={searchInput} allowClear
                                          onChange={e => setSearchInput(e.target.value)}
                                          onSearch={(num) => {
                                                  if (num) {
                                                  return router.navigate({search: {num} as never, replace: true})
                                              }
                                          }}/>
                            <div className={'ml-2'}>
                                <Button type={"primary"} icon={<HistoryOutlined/>}
                                        onClick={() => setHistoryModalOpen(true)}/>
                            </div>
                        </div>
                    )}
                    <Await promise={loaderData}>
                        {(video: SearchVideoView | undefined, loading) => (
                            video ? (
                                <>
                                    <div className={'my-4 rounded-lg overflow-hidden'}>
                                        <VideoCover src={video.cover} num={video.num}/>
                                    </div>
                                    <div className={'text-center'}>
                                        <Tooltip title={'添加订阅'}>
                                            <Button type={'primary'} icon={<CarryOutOutlined/>} shape={'circle'}
                                                    onClick={() => {
                                                        setSubscribeOpen(true, video)
                                                    }}/>
                                        </Tooltip>
                                        <Tooltip title={'刷新'}>
                                            <Button type={'primary'} icon={<RedoOutlined/>} shape={'circle'}
                                                    className={'ml-4'}
                                                    onClick={() => {
                                                        router.invalidate({filter: d => d.routeId === routeId})
                                                        return router.navigate({
                                                            replace: true,
                                                            search: {...search, num: video.num} as never
                                                        })
                                                    }}/>
                                        </Tooltip>
                                        {detailMatch && (
                                            <Tooltip title={'搜索'}>
                                                <Button type={'primary'} icon={<SearchOutlined/>} shape={'circle'}
                                                        className={'ml-4'}
                                                        onClick={() => {
                                                            setSearchInput(video.num || '')
                                                            return router.navigate({
                                                                to: '/search',
                                                                search: {num: video.num}
                                                            })
                                                        }}/>
                                            </Tooltip>
                                        )}
                                    </div>
                                    <Descriptions className={'mt-4'}
                                                  layout={'vertical'}
                                                  items={renderItems(video)}
                                                  column={24}
                                                  size={'small'}/>
                                    <ActorsModal open={actorsModalOpen} onCancel={() => setActorsModalOpen(false)}
                                                 actors={video.site_actors}/>
                                </>
                            ) : (
                                <div className={'py-11'}>
                                    {loading ? (
                                        <Skeleton active/>
                                    ) : (
                                        <Empty/>
                                    )}
                                </div>
                            )
                        )}
                    </Await>
                </Card>
            </Col>
            <Col span={24} lg={16} md={12}>
                <Await promise={loaderData}>
                        {(video: SearchVideoView | undefined) => {
                            if (video?.previews) {
                            const previews = video.previews.find((i) => i.source.site_id === previewSelected) || video.previews[0]
                            return (
                                <Card title={'预览'} className={'mb-4'} extra={(
                                    <Segmented
                                        onChange={(value: number) => setPreviewSelected(value)}
                                        options={video.previews.map((i) => ({
                                            label: i.source.site_name,
                                            value: i.source.site_id,
                                        }))}
                                    />
                                )}>
                                    <Preview data={previews.items}/>
                                </Card>
                            )
                        } else {
                            return <div></div>
                        }
                    }}
                </Await>
                <Card title={'资源列表'} extra={
                    <>
                        <Tag color={filter.isHd ? 'red' : 'default'} className={'cursor-pointer'}
                             onClick={() => setFilter({...filter, isHd: !filter.isHd})}>高清</Tag>
                        <Tag color={filter.isZh ? 'blue' : 'default'} className={'cursor-pointer'}
                             onClick={() => setFilter({...filter, isZh: !filter.isZh})}>中文</Tag>
                        <Tag color={filter.isUncensored ? 'green' : 'default'} className={'cursor-pointer'}
                             onClick={() => setFilter({
                                 ...filter,
                                 isUncensored: !filter.isUncensored
                             })}>无码</Tag>
                    </>
                }>
                    <Await promise={loaderData}>
                        {(video: SearchVideoView | undefined, loading) => {
                            const downloads = video?.downloads?.filter((item) => (
                                (!filter.isHd || item.is_hd) && (!filter.isZh || item.is_zh) && ((!filter.isUncensored || item.is_uncensored))
                            ))
                            return downloads ? (
                                <List dataSource={downloads} renderItem={(item) => (
                                    <List.Item actions={[
                                        <Tooltip title={'发送到下载器'}>
                                            <Button type={'primary'} icon={<CloudDownloadOutlined/>}
                                                    shape={'circle'}
                                                    onClick={() => {
                                                        setSelectedVideo(video)
                                                        setSelectedDownload(item)
                                                    }}
                                            />
                                        </Tooltip>,
                                        <Tooltip title={'复制磁力链接'}>
                                            <Button type={'primary'} icon={<CopyOutlined/>} shape={'circle'}
                                                    onClick={() => onCopyClick(item)}/>
                                        </Tooltip>
                                    ]}>
                                        <List.Item.Meta title={item.name}
                                                        description={(
                                                            <Space
                                                                direction={responsive.lg ? 'horizontal' : 'vertical'}
                                                                size={responsive.lg ? 0 : 'small'}>
                                                                <div>
                                                                    <a href={item.url}><Tag>{item.source.site_name}</Tag></a>
                                                                    <Tag>{item.size}</Tag>
                                                                </div>
                                                                <div>
                                                                    {item.is_hd &&
                                                                        <Tag color={'red'}
                                                                             bordered={false}>高清</Tag>}
                                                                    {item.is_zh &&
                                                                        <Tag color={'blue'}
                                                                             bordered={false}>中文</Tag>}
                                                                    {item.is_uncensored &&
                                                                        <Tag color={'green'}
                                                                             bordered={false}>无码</Tag>}
                                                                </div>
                                                                <div>{item.publish_date}</div>
                                                            </Space>
                                                        )}
                                        />
                                    </List.Item>
                                )}/>
                            ) : (
                                <div className={'py-8'}>
                                    {loading ? (
                                        <Skeleton active/>
                                    ) : (
                                        <Empty/>
                                    )}
                                </div>
                            )
                        }}
                    </Await>
                </Card>
                <Await promise={loaderData}>
                    {(video: SearchVideoView | undefined) => {
                        if (video?.comments && video.comments.length > 0) {
                            const comments = video.comments.find((i) => i.source.site_id === commentSelected) || video.comments[0]
                            return (
                                <Card title={'评论'} className={'mt-4'} extra={(
                                    <Segmented
                                        onChange={(value: number) => setCommentSelected(value)}
                                        options={video.comments.map((i) => ({
                                            label: i.source.site_name,
                                            value: i.source.site_id,
                                        }))}
                                    />
                                )}>
                                    <Comment data={comments.items}/>
                                </Card>
                            )
                        } else {
                            return <div></div>
                        }
                    }}
                </Await>
            </Col>
            <SubscribeModifyModal width={1100}
                                  {...subscribeModalProps} />
            <DownloadModal open={!!selectedDownload}
                           download={selectedDownload}
                           onCancel={() => setSelectedDownload(undefined)}
                           onDownload={(item) => {
                               if (!selectedVideo || !selectedVideo.num) {
                                   message.error('视频信息缺失，请重试')
                                   return
                               }
                               onDownload({...selectedVideo, num: selectedVideo.num}, item)
                           }}
                           confirmLoading={onDownloading}
            />
            <HistoryModal open={historyModalOpen}
                          onCancel={() => setHistoryModalOpen(false)}
                              onClick={history => {
                              setHistoryModalOpen(false)
                              setSearchInput(history.num)
                              return router.navigate({search: {num: history.num} as never, replace: true})
                          }}
            />
        </Row>
    )
}
