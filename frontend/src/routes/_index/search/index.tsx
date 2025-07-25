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
import {CarryOutOutlined, CloudDownloadOutlined, CopyOutlined, HistoryOutlined, RedoOutlined} from "@ant-design/icons";
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

const cacheHistoryKey = 'search_video_histories'

export const Route = createFileRoute('/_index/search/')({
    component: Search,
    loaderDeps: ({search}) => search as any,
    loader: ({deps}) => {
        return {
            data: deps.num ? (
                api.searchVideo(deps).then(data => {
                    const res = {...data, actors: data.actors.map((i: any) => i.name).join(", ")}
                    const histories: any[] = JSON.parse(localStorage.getItem(cacheHistoryKey) || '[]')
                        .filter((i: any) => i.num.toUpperCase() !== res.num.toUpperCase())
                    const history = {num: res.num, actors: res.actors, title: res.title, cover: res.cover}
                    localStorage.setItem(cacheHistoryKey, JSON.stringify([history, ...histories.slice(0, 19)]))
                    return res
                }).catch(() => {

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
    const search: any = useSearch({from: routeId})
    const {data: loaderData} = useLoaderData<any>({from: routeId})

    const appDispatch = useDispatch<Dispatch>().app
    const responsive = useResponsive()
    const [searchInput, setSearchInput] = useState(search?.num)
    const [filter, setFilter] = useState({isHd: false, isZh: false, isUncensored: false})
    const [previewSelected, setPreviewSelected] = useState<string>()
    const [commentSelected, setCommentSelected] = useState<string>()

    const [selectedVideo, setSelectedVideo] = useState<any>()
    const [selectedDownload, setSelectedDownload] = useState<any>()
    const [historyModalOpen, setHistoryModalOpen] = useState(false)

    useEffect(() => {
        if (detailMatch) {
            appDispatch.setCanBack(true)
        }
        return () => {
            appDispatch.setCanBack(false)
        }
    }, [])

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

    function renderItems(video: any) {
        return [
            {
                key: 'actors',
                label: '演员',
                span: 24,
                children: video.actors,
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
                children: video.outline,
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
                        {video.tags.map((i: any) => (
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

    function onCopyClick(item: any) {
        const textarea = document.createElement('textarea');
        textarea.value = item.magnet;
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
                                              return router.navigate({search: {num: num} as any, replace: true})
                                          }}/>
                            <div className={'ml-2'}>
                                <Button type={"primary"} icon={<HistoryOutlined/>}
                                        onClick={() => setHistoryModalOpen(true)}/>
                            </div>
                        </div>
                    )}
                    <Await promise={loaderData}>
                        {(video, loading) => (
                            video ? (
                                <>
                                    <div className={'my-4 rounded-lg overflow-hidden'}>
                                        <VideoCover src={video.cover}/>
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
                                                            search: {...search, num: video.num}
                                                        })
                                                    }}/>
                                        </Tooltip>
                                    </div>
                                    <Descriptions className={'mt-4'}
                                                  layout={'vertical'}
                                                  items={renderItems(video)}
                                                  column={24}
                                                  size={'small'}/>
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
                    {(video) => {
                        if (video?.previews) {
                            const previews = video.previews.find((i: any) => i.website === previewSelected) || video.previews[0]
                            return (
                                <Card title={'预览'} className={'mb-4'} extra={(
                                    <Segmented onChange={(value: string) => setPreviewSelected(value)}
                                               options={video.previews.map((i: any) => i.website)}/>
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
                        {(video: any, loading) => {
                            const downloads = video?.downloads?.filter((item: any) => (
                                (!filter.isHd || item.is_hd) && (!filter.isZh || item.is_zh) && ((!filter.isUncensored || item.is_uncensored))
                            ))
                            return downloads ? (
                                <List dataSource={downloads} renderItem={(item: any) => (
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
                                                                    <a href={item.url}><Tag>{item.website}</Tag></a>
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
                    {(video) => {
                        if (video?.comments && video.comments.length > 0) {
                            const comments = video.comments.find((i: any) => i.website === commentSelected) || video.comments[0]
                            return (
                                <Card title={'评论'} className={'mt-4'} extra={(
                                    <Segmented onChange={(value: string) => setCommentSelected(value)}
                                               options={video.comments.map((i: any) => i.website)}/>
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
                           onDownload={item => onDownload(selectedVideo, item)}
                           confirmLoading={onDownloading}
            />
            <HistoryModal open={historyModalOpen}
                          onCancel={() => setHistoryModalOpen(false)}
                          onClick={history => {
                              setHistoryModalOpen(false)
                              setSearchInput(history.num)
                              return router.navigate({search: {num: history.num} as any, replace: true})
                          }}
            />
        </Row>
    )
}

