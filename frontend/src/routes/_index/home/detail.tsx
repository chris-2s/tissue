import {
    Button,
    Card,
    Col,
    Descriptions,
    List,
    message,
    Row,
    Segmented,
    Space,
    Tag,
    Tooltip
} from "antd";
import {queryOptions, useSuspenseQuery} from "@tanstack/react-query";
import React, {useEffect, useState} from "react";
import {
    CarryOutOutlined,
    CloudDownloadOutlined,
    CopyOutlined,
    RedoOutlined,
    SearchOutlined
} from "@ant-design/icons";
import {createFileRoute, type ErrorComponentProps, useRouter} from "@tanstack/react-router";
import {useRequest, useResponsive} from "ahooks";
import {useDispatch} from "react-redux";
import * as homeApi from "../../../apis/home";
import * as subscribeApi from "../../../apis/subscribe";
import RouteErrorState from "../../../components/RouteErrorState";
import RoutePendingState from "../../../components/RoutePendingState";
import VideoCover from "../../../components/VideoCover";
import Websites from "../../../components/Websites";
import type {Dispatch} from "../../../models";
import type {VideoDetail, VideoDownload} from "../../../types/video";
import {useFormModal} from "../../../utils/useFormModal.ts";
import Preview from "./-components/preview.tsx";
import DownloadModal from "./-components/downloadModal.tsx";
import Comment from "./-components/comment.tsx";
import ActorsModal from "./-components/actorsModal.tsx";
import SubscribeModifyModal from "../subscribe/-components/modifyModal.tsx";

type SearchVideoView = Omit<VideoDetail, 'actors'> & { actors: string };
type DetailSearch = homeApi.GetDetailParams;

function detailQueryOptions(search: DetailSearch) {
    return queryOptions({
        queryKey: ['videoDetail', search] as const,
        staleTime: 10 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        retry: 0,
        queryFn: async (): Promise<SearchVideoView> => {
            const request = ('site_id' in search && 'url' in search)
                ? homeApi.getDetail(search as homeApi.GetSiteDetailParams)
                : subscribeApi.searchVideo({num: (search as homeApi.GetNumberDetailParams).num});
            const data = await request;

            return {
                ...data,
                actors: data.actors.map((item) => item.name).filter(Boolean).join(", ")
            };
        }
    });
}

function DetailError(props: ErrorComponentProps) {
    const router = useRouter();

    return (
        <RouteErrorState
            title={'详情加载失败'}
            description={'请检查网络或数据源状态后重试。'}
            onRetry={async () => {
                props.reset();
                await router.invalidate({
                    filter: (route) => route.routeId === '/_index/home/detail'
                });
            }}
        />
    );
}

export const Route = createFileRoute('/_index/home/detail')({
    component: Detail,
    pendingComponent: RoutePendingState,
    errorComponent: DetailError,
    pendingMs: 200,
    pendingMinMs: 300,
    loaderDeps: ({search}) => search,
    loader: ({deps, context}) => {
        return context.queryClient.ensureQueryData(detailQueryOptions(deps as DetailSearch));
    }
});

function Detail() {
    const router = useRouter();
    const responsive = useResponsive();
    const search = Route.useSearch() as DetailSearch;
    const {data: video, isFetching, refetch} = useSuspenseQuery(detailQueryOptions(search));
    const appDispatch = useDispatch<Dispatch>().app;

    const [filter, setFilter] = useState({isHd: false, isZh: false, isUncensored: false});
    const [previewSelected, setPreviewSelected] = useState<number>();
    const [commentSelected, setCommentSelected] = useState<number>();
    const [selectedDownload, setSelectedDownload] = useState<VideoDownload>();
    const [actorsModalOpen, setActorsModalOpen] = useState(false);

    useEffect(() => {
        appDispatch.setCanBack(true);
        return () => {
            appDispatch.setCanBack(false);
        };
    }, [appDispatch]);

    useEffect(() => {
        setPreviewSelected(video.previews[0]?.source.site_id);
    }, [video.previews]);

    useEffect(() => {
        setCommentSelected(video.comments[0]?.source.site_id);
    }, [video.comments]);

    const {setOpen: setSubscribeOpen, modalProps: subscribeModalProps} = useFormModal({
        service: subscribeApi.modifySubscribe,
        onOk: () => {
            setSubscribeOpen(false);
            return message.success("订阅添加成功");
        }
    });

    const {run: onDownload, loading: onDownloading} = useRequest(subscribeApi.downloadVideos, {
        manual: true,
        onSuccess: () => {
            setSelectedDownload(undefined);
            return message.success("下载任务创建成功");
        }
    });

    function onCopyClick(item: VideoDownload) {
        const textarea = document.createElement('textarea');
        textarea.value = item.magnet || '';
        textarea.style.position = 'fixed';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        return message.success("磁力链接已复制");
    }

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
                label: '影片',
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
                children: <span className={'whitespace-pre-wrap'}>{video.outline}</span>,
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
                        {video.tags.map((item) => (
                            <Tag key={item}>{item}</Tag>
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
                children: <Websites value={video.website} readonly/>,
            },
        ];
    }

    const filteredDownloads = video.downloads.filter((item) => (
        (!filter.isHd || item.is_hd) &&
        (!filter.isZh || item.is_zh) &&
        (!filter.isUncensored || item.is_uncensored)
    ));
    const isSearchMode = !('site_id' in search && 'url' in search);

    return (
        <Row gutter={[15, 15]}>
            <Col span={24} lg={8} md={12}>
                <Card>
                    <div className={'my-4 rounded-lg overflow-hidden'}>
                        <VideoCover src={video.cover} num={video.num}/>
                    </div>
                    <div className={'text-center'}>
                        <Tooltip title={'添加订阅'}>
                            <Button type={'primary'} icon={<CarryOutOutlined/>} shape={'circle'}
                                    onClick={() => setSubscribeOpen(true, video)}/>
                        </Tooltip>
                        <Tooltip title={'刷新'}>
                            <Button type={'primary'} icon={<RedoOutlined/>} shape={'circle'}
                                    className={'ml-4'}
                                    loading={isFetching}
                                    onClick={() => void refetch()}/>
                        </Tooltip>
                        {!isSearchMode && (
                            <Tooltip title={'搜索'}>
                                <Button type={'primary'} icon={<SearchOutlined/>} shape={'circle'}
                                        className={'ml-4'}
                                        onClick={() => {
                                            router.navigate({
                                                to: '/home/detail',
                                                search: {num: video.num || ''} as never
                                            });
                                        }}/>
                            </Tooltip>
                        )}
                    </div>
                    <Descriptions className={'mt-4'}
                                  layout={'vertical'}
                                  items={renderItems(video)}
                                  column={24}
                                  size={'small'}/>
                    <ActorsModal open={actorsModalOpen}
                                 onCancel={() => setActorsModalOpen(false)}
                                 actors={video.site_actors}/>
                </Card>
            </Col>
            <Col span={24} lg={16} md={12}>
                {video.previews.length > 0 && (
                    <Card title={'预览'} className={'mb-4'} extra={(
                        <Segmented
                            value={previewSelected}
                            onChange={(value: number) => setPreviewSelected(value)}
                            options={video.previews.map((item) => ({
                                label: item.source.site_name,
                                value: item.source.site_id,
                            }))}
                        />
                    )}>
                        <Preview data={(video.previews.find((item) => item.source.site_id === previewSelected) || video.previews[0]).items}/>
                    </Card>
                )}
                <Card title={'资源列表'} extra={(
                    <>
                        <Tag color={filter.isHd ? 'red' : 'default'} className={'cursor-pointer'}
                             onClick={() => setFilter({...filter, isHd: !filter.isHd})}>高清</Tag>
                        <Tag color={filter.isZh ? 'blue' : 'default'} className={'cursor-pointer'}
                             onClick={() => setFilter({...filter, isZh: !filter.isZh})}>中文</Tag>
                        <Tag color={filter.isUncensored ? 'green' : 'default'} className={'cursor-pointer'}
                             onClick={() => setFilter({...filter, isUncensored: !filter.isUncensored})}>无码</Tag>
                    </>
                )}>
                    {filteredDownloads.length > 0 ? (
                        <List dataSource={filteredDownloads} renderItem={(item) => (
                            <List.Item actions={[
                                <Tooltip title={'发送到下载器'} key={'download'}>
                                    <Button type={'primary'} icon={<CloudDownloadOutlined/>}
                                            shape={'circle'}
                                            onClick={() => setSelectedDownload(item)}/>
                                </Tooltip>,
                                <Tooltip title={'复制磁力链接'} key={'copy'}>
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
                                                            {item.is_hd && <Tag color={'red'} bordered={false}>高清</Tag>}
                                                            {item.is_zh && <Tag color={'blue'} bordered={false}>中文</Tag>}
                                                            {item.is_uncensored &&
                                                                <Tag color={'green'} bordered={false}>无码</Tag>}
                                                        </div>
                                                        <div>{item.publish_date}</div>
                                                    </Space>
                                                )}/>
                            </List.Item>
                        )}/>
                    ) : (
                        <div className={'py-8 text-center text-[var(--ant-color-text-secondary)]'}>
                            暂无资源
                        </div>
                    )}
                </Card>
                {video.comments.length > 0 && (
                    <Card title={'评论'} className={'mt-4'} extra={(
                        <Segmented
                            value={commentSelected}
                            onChange={(value: number) => setCommentSelected(value)}
                            options={video.comments.map((item) => ({
                                label: item.source.site_name,
                                value: item.source.site_id,
                            }))}
                        />
                    )}>
                        <Comment data={(video.comments.find((item) => item.source.site_id === commentSelected) || video.comments[0]).items}/>
                    </Card>
                )}
            </Col>
            <SubscribeModifyModal width={1100} {...subscribeModalProps}/>
            <DownloadModal open={!!selectedDownload}
                           download={selectedDownload}
                           onCancel={() => setSelectedDownload(undefined)}
                           onDownload={(item) => {
                               if (!video.num) {
                                   message.error('视频信息缺失，请重试');
                                   return;
                               }
                               onDownload({...video, num: video.num}, item);
                           }}
                           confirmLoading={onDownloading}/>
        </Row>
    );
}
