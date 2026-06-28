import {Button, Card, Col, Empty, Pagination, Row, Space, Tag, Typography, message} from "antd";
import {DeleteOutlined, RightOutlined} from "@ant-design/icons";
import {queryOptions, useQuery, useQueryClient} from "@tanstack/react-query";
import React, {useDeferredValue, useEffect, useMemo, useState} from "react";
import {createFileRoute, useNavigate} from "@tanstack/react-router";
import {useRequest} from "ahooks";
import * as actorApi from "../../../apis/actor.ts";
import RouteErrorState from "../../../components/RouteErrorState";
import RoutePendingState from "../../../components/RoutePendingState";
import RemoteImage from "../../../components/RemoteImage";
import {IMAGE_TYPES} from "../../../constants/image";
import FilterPanel from "./-components/filterPanel.tsx";
import type {ActorFavoriteFilterValue} from "./-components/filterPanel.utils.ts";
import {scrollPageToTop} from "../../../utils/scroll.ts";
import {useTranslation} from "react-i18next";

const {Paragraph, Text} = Typography;

export const Route = createFileRoute('/_index/actor-favorite/')({
    component: ActorFavoritePage
});

function favoritesQueryOptions() {
    return queryOptions({
        queryKey: ['actorFavorites'] as const,
        staleTime: 30 * 1000,
        gcTime: 5 * 60 * 1000,
        retry: 1,
        queryFn: actorApi.getActorFavorites
    });
}

function ActorFavoritePage() {
    const {t} = useTranslation(['actor', 'common']);
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const {data = [], isPending, isError, refetch} = useQuery(favoritesQueryOptions());
    const [filters, setFilters] = useState<ActorFavoriteFilterValue>({tokens: []});
    const deferredFilters = useDeferredValue(filters);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(24);

    const {run: onDelete, loading: deleting} = useRequest(actorApi.deleteActorFavorite, {
        manual: true,
        onSuccess: async () => {
            message.success(t('actor:favorite.deleteSuccess'));
            await queryClient.invalidateQueries({queryKey: ['actorFavorites']});
        }
    });

    const favorites = useMemo(() => data.filter((favorite) => {
        return deferredFilters.tokens.every((token) => {
            const keyword = token.value.trim().toUpperCase();
            if (!keyword) {
                return true;
            }

            if (token.kind === "alias") {
                return favorite.actor.alias.some((alias) => alias.trim().toUpperCase().includes(keyword));
            }

            return (favorite.actor.name || favorite.actor_code || "").trim().toUpperCase().includes(keyword);
        });
    }), [data, deferredFilters]);

    useEffect(() => {
        setPage(1);
    }, [deferredFilters]);

    useEffect(() => {
        const maxPage = Math.max(1, Math.ceil(favorites.length / pageSize));
        if (page > maxPage) {
            setPage(maxPage);
        }
    }, [favorites.length, page, pageSize]);

    const pagedFavorites = useMemo(() => {
        const start = (page - 1) * pageSize;
        return favorites.slice(start, start + pageSize);
    }, [favorites, page, pageSize]);

    if (isPending) {
        return <RoutePendingState/>;
    }

    if (isError) {
        return (
            <RouteErrorState
                title={t('actor:favorite.loadErrorTitle')}
                description={t('actor:favorite.loadErrorDescription')}
                onRetry={async () => {
                    await refetch();
                }}
            />
        );
    }

    if (data.length === 0) {
        return <Empty description={t('actor:favorite.empty')}/>;
    }

    return (
        <div>
            <FilterPanel
                favorites={data}
                total={data.length}
                filteredTotal={favorites.length}
                value={filters}
                onChange={setFilters}
            />
            {favorites.length > 0 ? (
                <>
                    <Row gutter={[15, 15]}>
                        {pagedFavorites.map((favorite) => {
                            const aliasText = favorite.actor.alias.filter(Boolean).join(' / ');
                            return (
                                <Col key={favorite.id} span={24} md={12} lg={8}>
                                    <Card
                                        hoverable
                                        size={'small'}
                                        actions={[
                                            <Button key={'open'}
                                                type={'link'}
                                                icon={<RightOutlined/>}
                                                onClick={() => navigate({
                                                        to: '/actor',
                                                        search: {site_id: favorite.site_id, code: favorite.actor_code} as never
                                                    })}>
                                                {t('actor:favorite.openWorks')}
                                            </Button>,
                                            <Button key={'delete'}
                                                    type={'link'}
                                                    danger
                                                    loading={deleting}
                                                    icon={<DeleteOutlined/>}
                                                    onClick={() => onDelete(favorite.id)}>
                                                {t('common:actions.delete')}
                                            </Button>
                                        ]}
                                    >
                                        <div className={'flex gap-3'}>
                                            <div className={'h-[72px] w-[72px]'}>
                                                <RemoteImage
                                                    className={'h-full w-full'}
                                                    src={favorite.actor.thumb}
                                                    num={favorite.actor_code}
                                                    avatar
                                                    imageType={IMAGE_TYPES.AVATAR}
                                                />
                                            </div>
                                            <div className={'min-w-0 flex-1'}>
                                                <Space wrap size={[8, 8]}>
                                                    <Text strong>{favorite.actor.name || favorite.actor_code}</Text>
                                                    <Tag variant={'filled'}>{favorite.actor.source.site_name}</Tag>
                                                </Space>
                                                {aliasText ? (
                                                    <Paragraph type={'secondary'} className={'!mb-0 !mt-2 min-h-[44px]'} ellipsis={{rows: 2}}>
                                                        {t('actor:detail.aliasPrefix')}{aliasText}
                                                    </Paragraph>
                                                ) : (
                                                    <Paragraph type={'secondary'} className={'!mb-0 !mt-2 min-h-[44px]'} ellipsis={{rows: 2}}>
                                                        {t('actor:detail.aliasEmpty')}
                                                    </Paragraph>
                                                )}
                                            </div>
                                        </div>
                                    </Card>
                                </Col>
                            );
                        })}
                    </Row>
                    <div className={'mt-4 flex justify-center'}>
                        <Pagination
                            current={page}
                            pageSize={pageSize}
                            total={favorites.length}
                            showSizeChanger
                            pageSizeOptions={[24, 48, 96]}
                            onChange={(nextPage, nextPageSize) => {
                                setPage(nextPage);
                                setPageSize(nextPageSize);
                                scrollPageToTop();
                            }}
                        />
                    </div>
                </>
            ) : (
                <Empty description={t('actor:favorite.emptyFiltered')}/>
            )}
        </div>
    );
}
