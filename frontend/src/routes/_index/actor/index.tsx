import {Button, Card, Col, Empty, Pagination, Row, Space, Tag, Tooltip, Typography, message} from "antd";
import {HeartFilled, HeartOutlined} from "@ant-design/icons";
import {queryOptions, useSuspenseQuery} from "@tanstack/react-query";
import React, {useEffect, useState} from "react";
import * as actorApi from "../../../apis/actor.ts";
import {createFileRoute, type ErrorComponentProps, useNavigate, useRouter} from "@tanstack/react-router";
import RouteErrorState from "../../../components/RouteErrorState";
import RoutePendingState from "../../../components/RoutePendingState";
import RemoteImage from "../../../components/RemoteImage";
import {IMAGE_TYPES} from "../../../constants/image";
import {useDispatch} from "react-redux";
import VideoItem from "../home/-components/item.tsx";
import type {Dispatch} from "../../../models";
import {useRequest, useResponsive} from "ahooks";
import {scrollPageToTop} from "../../../utils/scroll.ts";
import {useTranslation} from "react-i18next";

const {Paragraph, Text, Title} = Typography;

type ActorSearch = {
    site_id: number;
    code: string;
    page?: number;
};

function actorQueryOptions(search: ActorSearch) {
    return queryOptions({
        queryKey: ['actorPage', search] as const,
        staleTime: 10 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        retry: 0,
        queryFn: () => actorApi.getActorPage(search)
    });
}

function ActorError(props: ErrorComponentProps) {
    const {t} = useTranslation(['actor']);
    const router = useRouter();

    return (
        <RouteErrorState
            title={t('actor:detail.loadErrorTitle')}
            description={t('actor:detail.loadErrorDescription')}
            onRetry={async () => {
                props.reset();
                await router.invalidate({
                    filter: (route) => route.routeId === '/_index/actor/',
                    sync: true
                });
            }}
        />
    );
}

export const Route = createFileRoute('/_index/actor/')({
    component: Actor,
    pendingComponent: RoutePendingState,
    errorComponent: ActorError,
    pendingMs: 200,
    pendingMinMs: 300,
    loaderDeps: ({search}) => ({
        ...(search as ActorSearch),
        page: Number((search as ActorSearch).page || 1)
    }),
    loader: ({deps, context}) => context.queryClient.ensureQueryData(actorQueryOptions(deps as ActorSearch))
});

function Actor() {
    const {t} = useTranslation(['actor']);
    const search = Route.useSearch() as ActorSearch;
    const normalizedSearch: ActorSearch = {
        ...search,
        page: Number(search.page || 1)
    };
    const {data: actorPage, refetch, isFetching} = useSuspenseQuery(actorQueryOptions(normalizedSearch));
    const navigate = useNavigate();
    const appDispatch = useDispatch<Dispatch>().app;
    const responsive = useResponsive();
    const [favoriteRefreshing, setFavoriteRefreshing] = useState(false);

    useEffect(() => {
        appDispatch.setCanBack(true);
        return () => {
            appDispatch.setCanBack(false);
        };
    }, [appDispatch]);

    const {run: onCreateFavorite, loading: creatingFavorite} = useRequest(actorApi.createActorFavorite, {
        manual: true,
        onSuccess: async () => {
            message.success(t('actor:detail.favoriteCreated'));
            await refetch();
            setFavoriteRefreshing(false);
        },
        onError: () => {
            setFavoriteRefreshing(false);
        }
    });

    const {run: onDeleteFavorite, loading: deletingFavorite} = useRequest(actorApi.deleteActorFavorite, {
        manual: true,
        onSuccess: async () => {
            message.success(t('actor:detail.favoriteRemoved'));
            await refetch();
            setFavoriteRefreshing(false);
        },
        onError: () => {
            setFavoriteRefreshing(false);
        }
    });

    const actor = actorPage.actor;
    const videos = actorPage.page.data || [];
    const aliasText = actor.alias.filter(Boolean).join(' / ');
    const favoriteLoading = creatingFavorite || deletingFavorite || favoriteRefreshing || isFetching;

    async function onFavoriteToggle() {
        setFavoriteRefreshing(true);
        if (actorPage.is_favorite) {
            const favorites = await actorApi.getActorFavorites();
            const favorite = favorites.find((item) => (
                item.site_id === normalizedSearch.site_id && item.actor_code === normalizedSearch.code
            ));
            if (!favorite) {
                setFavoriteRefreshing(false);
                message.error(t('actor:detail.favoriteMissing'));
                return;
            }
            onDeleteFavorite(favorite.id);
            return;
        }

        onCreateFavorite({
            site_id: normalizedSearch.site_id,
            actor_code: normalizedSearch.code,
            actor_name: actor.name,
            actor_thumb: actor.thumb,
            actor_alias: actor.alias || [],
        });
    }

    return (
        <div>
            <Card className={'mb-4'}>
                <div className={'flex flex-col gap-4 md:flex-row md:items-center md:justify-between'}>
                    <Space size={16} align={'start'}>
                        <div className={`${responsive.md ? 'h-[88px] w-[88px]' : 'h-[72px] w-[72px]'}`}>
                            <RemoteImage
                                className={'h-full w-full'}
                                src={actor.thumb}
                                num={actor.code}
                                avatar
                                imageType={IMAGE_TYPES.AVATAR}
                            />
                        </div>
                        <div>
                            <Space wrap size={[8, 8]}>
                                <Title level={4} className={'!mb-0'}>
                                    {actor.name || actor.code || t('actor:detail.unknownActor')}
                                </Title>
                                <Tag color={'purple'} variant={'filled'}>{actor.source.site_name}</Tag>
                            </Space>
                            {aliasText ? (
                                <Tooltip title={aliasText}>
                                    <Paragraph type={'secondary'} className={'!mb-0 !mt-2'}>
                                        {t('actor:detail.aliasPrefix')}{aliasText}
                                    </Paragraph>
                                </Tooltip>
                            ) : (
                                <Text type={'secondary'} className={'block mt-2'}>
                                    {t('actor:detail.aliasEmpty')}
                                </Text>
                            )}
                        </div>
                    </Space>
                    <Button
                        type={'primary'}
                        danger={actorPage.is_favorite}
                        icon={actorPage.is_favorite ? <HeartFilled style={{color: '#ff4d4f'}}/> : <HeartOutlined/>}
                        loading={favoriteLoading}
                        onClick={() => void onFavoriteToggle()}
                    >
                        {actorPage.is_favorite ? t('actor:detail.removeFavorite') : t('actor:detail.addFavorite')}
                    </Button>
                </div>
            </Card>

            {videos.length > 0 ? (
                <Row className={'mt-2 cursor-pointer'} gutter={[12, 12]}>
                    {videos.map((item) => (
                        <Col key={item.url} span={24} md={12} lg={6}
                             onClick={() => navigate({
                                 to: '/home/detail',
                                 search: {site_id: normalizedSearch.site_id, num: item.num, url: item.url}
                             })}>
                            <VideoItem item={item}/>
                        </Col>
                    ))}
                    <div className={'w-full flex justify-center'}>
                        <Pagination pageSize={actorPage.page.limit}
                                    current={actorPage.page.page}
                                    total={actorPage.page.total}
                                    showSizeChanger={false}
                                    onChange={(page) => {
                                        scrollPageToTop();
                                        navigate({search: {...normalizedSearch, page} as never});
                                    }}/>
                    </div>
                </Row>
            ) : (
                <Empty className={'mt-10'} description={t('actor:detail.emptyWorks')}/>
            )}
        </div>
    );
}

export default Actor;
