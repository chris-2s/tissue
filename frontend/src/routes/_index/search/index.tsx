import {
    Button,
    Card,
    Col,
    Descriptions,
    Empty,
    Input,
    List,
    message,
    Modal,
    Row, Skeleton,
    Space,
    Tag,
    Tooltip
} from "antd";
import React, {useEffect, useState} from "react";
import {CarryOutOutlined, CloudDownloadOutlined, CopyOutlined, RedoOutlined} from "@ant-design/icons";
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

const cacheSearchKey = 'search_video_num'
const cacheKey = 'search_video_information'

export const Route = createFileRoute('/_index/search/')({
    component: Search,
    loaderDeps: ({search}) => search as any,
    loader: ({deps}) => ({
        data: deps.num ? (
            api.searchVideo(deps).then(data => {
                const res = {...data, actors: data.actors.map((i: any) => i.name).join(", ")}
                localStorage.setItem(cacheKey, JSON.stringify(res))
                return res
            }).catch(()=>{

            })
        ) : (
            new Promise((resolve) => {
                const cached = localStorage.getItem(cacheKey);
                if (cached) {
                    resolve(JSON.parse(cached));
                } else {
                    resolve(undefined)
                }
            })
        )
    })
})


export function Search() {

    const router = useRouter()

    const detailMatch = useMatch({from: '/_index/home/detail', shouldThrow: false})
    const routeId = detailMatch ? '/_index/home/detail' : '/_index/search/'
    const search: any = useSearch({from: routeId})
    const {data: loaderData} = useLoaderData<any>({from: routeId})

    const appDispatch = useDispatch<Dispatch>().app
    const responsive = useResponsive()
    const [searchInput, setSearchInput] = useState(localStorage.getItem(cacheSearchKey) || '')
    const [filter, setFilter] = useState({isHd: false, isZh: false, isUncensored: false})


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

    const {runAsync: onDownload} = useRequest(api.downloadVideos, {
        manual: true,
        onSuccess: () => {
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
                key: 'outline',
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

    function onDownloadClick(video: any, item: any) {
        Modal.confirm({
            title: '是否确认下载：' + item.name,
            content: (
                <div>
                    <Tag>{item.size}</Tag>
                    <Tag>{item.publish_date}</Tag>
                    {item.is_hd && <Tag color={'red'} bordered={false}>高清</Tag>}
                    {item.is_zh && <Tag color={'blue'} bordered={false}>中文</Tag>}
                    {item.is_uncensored &&
                        <Tag color={'green'} bordered={false}>无码</Tag>}
                </div>
            ),
            onOk: () => {
                return onDownload(video, item)
            }
        })
    }


    return (
        <Row gutter={[15, 15]}>
            <Col span={24} lg={8} md={12}>
                <Await promise={loaderData}>
                    {(video, loading) => (
                        <Card>
                            {!detailMatch && (
                                <Input.Search placeholder={'请输入番号'} enterButton
                                              value={searchInput}
                                              onChange={e => setSearchInput(e.target.value)}
                                              onSearch={(num) => {
                                                  localStorage.setItem(cacheSearchKey, num)
                                                  return router.navigate({search: {num: num} as any, replace: true})
                                              }}/>
                            )}
                            {video ? (
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
                                loading ? (
                                    <Skeleton active/>
                                ) : (
                                    <div className={'py-11'}>
                                        <Empty/>
                                    </div>
                                )
                            )}
                        </Card>
                    )}
                </Await>
            </Col>
            <Col span={24} lg={16} md={12}>
                <Await promise={loaderData}>
                    {(video: any, loading) => {
                        const downloads = video?.downloads?.filter((item: any) => (
                            (!filter.isHd || item.is_hd) && (!filter.isZh || item.is_zh) && ((!filter.isUncensored || item.is_uncensored))
                        ))
                        return (
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
                                {downloads ? (
                                    <List dataSource={downloads} renderItem={(item: any) => (
                                        <List.Item actions={[
                                            <Tooltip title={'发送到下载器'}>
                                                <Button type={'primary'} icon={<CloudDownloadOutlined/>}
                                                        shape={'circle'}
                                                        onClick={() => onDownloadClick(video, item)}
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
                                    loading ? (
                                        <Skeleton active/>
                                    ) : (
                                        <div className={'py-8'}>
                                            <Empty/>
                                        </div>
                                    )
                                )}
                            </Card>
                        )
                    }}
                </Await>
            </Col>
            <SubscribeModifyModal width={1100}
                                  {...subscribeModalProps} />
        </Row>
    )
}

