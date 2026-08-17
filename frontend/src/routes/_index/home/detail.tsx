import {
    Card,
    Col,
    Descriptions,
    List,
    message,
    Row,
    Segmented,
    Tag
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
import RemoteImage from "../../../components/RemoteImage";
import {IMAGE_TYPES} from "../../../constants/image";
import Websites from "../../../components/Websites";
import type {Dispatch} from "../../../models";
import type {VideoDetail, VideoDownload} from "../../../types/video";
import {useFormModal} from "../../../utils/useFormModal.ts";
import Preview from "./-components/preview.tsx";
import DownloadModal from "./-components/downloadModal.tsx";
import Comment from "./-components/comment.tsx";
import ActorsModal from "./-components/actorsModal.tsx";
import SubscribeModifyModal from "../subscribe/-components/modifyModal.tsx";
import {useTranslation} from "react-i18next";
import ActionButton from "../../../components/ActionButton";
import IconButton from "../../../components/IconButton";

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
    const {t} = useTranslation(['home']);
    const router = useRouter();

    return (
        <RouteErrorState
            title={t('home:detail.loadTitle')}
            description={t('home:detail.loadDescription')}
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
    const {t} = useTranslation(['home']);
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
            return message.success(t('home:detail.subscribeSuccess'));
        }
    });

    const {run: onDownload, loading: onDownloading} = useRequest(subscribeApi.downloadVideos, {
        manual: true,
        onSuccess: () => {
            setSelectedDownload(undefined);
            return message.success(t('home:detail.downloadSuccess'));
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
        return message.success(t('home:detail.copyMagnetSuccess'));
    }

    function renderItems(video: SearchVideoView) {
        return [
            {
                key: 'actors',
                label: t('home:detail.fields.actors'),
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
                label: t('home:detail.fields.video'),
                span: 8,
                children: video.num,
            },
            {
                key: 'premiered',
                label: t('home:detail.fields.premiered'),
                span: 8,
                children: video.premiered,
            },
            {
                key: 'rating',
                label: t('home:detail.fields.rating'),
                span: 8,
                children: video.rating,
            },
            {
                key: 'title',
                label: t('home:detail.fields.title'),
                span: 24,
                children: video.title,
            },
            {
                key: 'outline',
                label: t('home:detail.fields.outline'),
                span: 24,
                children: <span className={'whitespace-pre-wrap'}>{video.outline}</span>,
            },
            {
                key: 'studio',
                label: t('home:detail.fields.studio'),
                span: 8,
                children: video.studio,
            },
            {
                key: 'publisher',
                label: t('home:detail.fields.publisher'),
                span: 8,
                children: video.publisher,
            },
            {
                key: 'director',
                label: t('home:detail.fields.director'),
                span: 8,
                children: video.director,
            },
            {
                key: 'tags',
                label: t('home:detail.fields.tags'),
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
                label: t('home:detail.fields.series'),
                span: 16,
                children: video.series,
            },
            {
                key: 'runtime',
                label: t('home:detail.fields.runtime'),
                span: 8,
                children: video.runtime,
            },
            {
                key: 'websites',
                label: t('home:detail.fields.websites'),
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
                        <RemoteImage
                            src={video.cover}
                            videoNumber={video.num}
                            isZh={video.is_zh}
                            isUncensored={video.is_uncensored}
                            imageType={IMAGE_TYPES.COVER}
                        />
                    </div>
                    <div className={'flex flex-wrap justify-center gap-1'}>
                        <ActionButton
                            icon={<CarryOutOutlined/>}
                            onClick={() => setSubscribeOpen(true, video)}
                        >
                            {t('home:detail.actions.addSubscription')}
                        </ActionButton>
                        <ActionButton
                            icon={<RedoOutlined/>}
                            loading={isFetching}
                            onClick={() => void refetch()}
                        >
                            {t('home:detail.actions.refresh')}
                        </ActionButton>
                        {!isSearchMode && (
                            <ActionButton
                                icon={<SearchOutlined/>}
                                onClick={() => {
                                    router.navigate({
                                        to: '/home/detail',
                                        search: {num: video.num || ''} as never
                                    });
                                }}
                            >
                                {t('home:detail.actions.search')}
                            </ActionButton>
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
                    <Card title={t('home:detail.sections.preview')} className={'mb-4'} extra={(
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
                <Card title={t('home:detail.sections.resources')} extra={(
                    <>
                        <Tag color={filter.isHd ? 'red' : 'default'} className={'cursor-pointer'}
                             onClick={() => setFilter({...filter, isHd: !filter.isHd})}>{t('home:detail.flags.hd')}</Tag>
                        <Tag color={filter.isZh ? 'blue' : 'default'} className={'cursor-pointer'}
                             onClick={() => setFilter({...filter, isZh: !filter.isZh})}>{t('home:detail.flags.zh')}</Tag>
                        <Tag color={filter.isUncensored ? 'green' : 'default'} className={'cursor-pointer'}
                             onClick={() => setFilter({...filter, isUncensored: !filter.isUncensored})}>{t('home:detail.flags.uncensored')}</Tag>
                    </>
                )}>
                    {filteredDownloads.length > 0 ? (
                        <List dataSource={filteredDownloads} renderItem={(item) => {
                            const openDownload = () => setSelectedDownload(item);
                            const actions = [
                                <ActionButton
                                    key={'download'}
                                    icon={<CloudDownloadOutlined/>}
                                    onClick={openDownload}
                                >
                                    {t('home:detail.actions.sendToDownloader')}
                                </ActionButton>,
                                <ActionButton
                                    key={'copy'}
                                    icon={<CopyOutlined/>}
                                    onClick={() => onCopyClick(item)}
                                >
                                    {t('home:detail.actions.copyMagnet')}
                                </ActionButton>
                            ];
                            const metadataTags = (
                                <>
                                    <a className={'shrink-0'} href={item.url}>
                                        <Tag className={'!mr-0'}>{item.source.site_name}</Tag>
                                    </a>
                                    <Tag className={'!mr-0 shrink-0'}>{item.size}</Tag>
                                    {item.is_hd && (
                                        <Tag className={'!mr-0 shrink-0'} color={'red'} variant={'filled'}>
                                            {t('home:detail.flags.hd')}
                                        </Tag>
                                    )}
                                    {item.is_zh && (
                                        <Tag className={'!mr-0 shrink-0'} color={'blue'} variant={'filled'}>
                                            {t('home:detail.flags.zh')}
                                        </Tag>
                                    )}
                                    {item.is_uncensored && (
                                        <Tag className={'!mr-0 shrink-0'} color={'green'} variant={'filled'}>
                                            {t('home:detail.flags.uncensored')}
                                        </Tag>
                                    )}
                                </>
                            );

                            return (
                                <List.Item
                                    className={responsive.lg
                                        ? '!py-3'
                                        : '!py-3 cursor-pointer transition-colors hover:bg-[var(--ant-color-fill-quaternary)] active:bg-[var(--ant-color-fill-tertiary)]'}
                                    actions={responsive.lg ? actions : undefined}
                                    role={responsive.lg ? undefined : 'button'}
                                    tabIndex={responsive.lg ? undefined : 0}
                                    onClick={responsive.lg ? undefined : openDownload}
                                    onKeyDown={responsive.lg ? undefined : (event) => {
                                        if (event.key === 'Enter' || event.key === ' ') {
                                            event.preventDefault();
                                            openDownload();
                                        }
                                    }}
                                >
                                    {responsive.lg ? (
                                        <div className={'min-w-0 flex-1'}>
                                            <div className={'font-medium text-[var(--ant-color-text)]'}>{item.name}</div>
                                            <div className={'mt-1.5 flex flex-wrap items-center gap-1'}>
                                                {metadataTags}
                                                <span className={'ml-1 text-sm text-[var(--ant-color-text-secondary)]'}>
                                                    {item.publish_date}
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className={'flex min-w-0 flex-1 items-center gap-2'}>
                                            <div className={'min-w-0 flex-1'}>
                                                <div className={'truncate font-medium text-[var(--ant-color-text)]'}>
                                                    {item.name}
                                                </div>
                                                <div
                                                    className={'mt-1 flex min-w-0 items-center gap-1 overflow-x-auto whitespace-nowrap'}
                                                    style={{scrollbarWidth: 'none'}}
                                                >
                                                    <Tag className={'!mr-0 shrink-0'}>{item.source.site_name}</Tag>
                                                    <Tag className={'!mr-0 shrink-0'}>{item.size}</Tag>
                                                    {item.is_hd && (
                                                        <Tag className={'!mr-0 shrink-0'} color={'red'} variant={'filled'}>
                                                            {t('home:detail.flags.hd')}
                                                        </Tag>
                                                    )}
                                                    {item.is_zh && (
                                                        <Tag className={'!mr-0 shrink-0'} color={'blue'} variant={'filled'}>
                                                            {t('home:detail.flags.zh')}
                                                        </Tag>
                                                    )}
                                                    {item.is_uncensored && (
                                                        <Tag className={'!mr-0 shrink-0'} color={'green'} variant={'filled'}>
                                                            {t('home:detail.flags.uncensored')}
                                                        </Tag>
                                                    )}
                                                </div>
                                                <div className={'mt-1 text-sm text-[var(--ant-color-text-secondary)]'}>
                                                    {item.publish_date}
                                                </div>
                                            </div>
                                            <IconButton
                                                aria-label={t('home:detail.actions.copyMagnet')}
                                                size={'sm'}
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    onCopyClick(item);
                                                }}
                                                onKeyDown={(event) => event.stopPropagation()}
                                            >
                                                <CopyOutlined/>
                                            </IconButton>
                                        </div>
                                    )}
                                </List.Item>
                            );
                        }}/>
                    ) : (
                        <div className={'py-8 text-center text-[var(--ant-color-text-secondary)]'}>
                            {t('home:detail.emptyResources')}
                        </div>
                    )}
                </Card>
                {video.comments.length > 0 && (
                    <Card title={t('home:detail.sections.comments')} className={'mt-4'} extra={(
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
                                   message.error(t('home:detail.missingVideoInfo'));
                                   return;
                               }
                               onDownload({...video, num: video.num}, item);
                           }}
                           confirmLoading={onDownloading}/>
        </Row>
    );
}
