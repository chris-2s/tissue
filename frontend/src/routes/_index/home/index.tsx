import Filter, {FilterField} from "./-components/filter.tsx";
import {queryOptions, useQuery} from "@tanstack/react-query";
import React from "react";
import {Col, Row} from "antd";
import VideoItem from "./-components/item.tsx";
import Selector from "../../../components/Selector";
import Slider from "../../../components/Slider";
import * as api from "../../../apis/home.ts";
import * as siteApi from "../../../apis/site.ts";
import type {GetRankingsParams} from "../../../apis/home.ts";
import type {SiteItem} from "../../../apis/site.ts";
import type {SiteVideo} from "../../../types/video.ts";
import {createFileRoute, redirect, useNavigate} from "@tanstack/react-router";
import Page from "../../../components/Page";
import RouteErrorState from "../../../components/RouteErrorState";
import RoutePendingState from "../../../components/RoutePendingState";
import {useTranslation} from "react-i18next";

type HomeSearch = GetRankingsParams & { rank: number };
type HomeQuerySearch = Omit<GetRankingsParams, 'site_id'> & { site_id?: number };
type HomeLoaderData = { siteId: number; items: SiteVideo[] };

function homeQueryOptions(search: HomeQuerySearch, t: (key: string) => string) {
    return queryOptions({
        queryKey: ['homeRankings', search] as const,
        staleTime: 10 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        retry: 0,
        queryFn: async (): Promise<HomeLoaderData> => {
            const sites = await siteApi.getSites();
            const rankingSites = sites.filter((item: SiteItem) => item.capabilities.supports_ranking);
            const preferredSite = rankingSites.find((item: SiteItem) => item.spider_key === 'javdb') || rankingSites[0];
            const siteId = search.site_id || preferredSite?.id;

            if (!siteId) {
                return {siteId: 0, items: []};
            }

            const items = await api.getRankings({...search, site_id: siteId});
            if (items.length === 0) {
                throw new Error(t('home:ranking.noData'));
            }

            return {siteId, items};
        }
    });
}

export const Route = createFileRoute('/_index/home/')({
    component: JavDB,
    beforeLoad: ({search}) => {
        if (Object.keys(search).length === 0) {
            throw redirect({search: {video_type: 'censored', cycle: 'daily', rank: 0}})
        }
    }
})

function JavDB() {
    const {t} = useTranslation(['home'])
    const rawSearch = Route.useSearch() as Partial<HomeSearch>
    const filter: HomeSearch = {
        site_id: Number(rawSearch.site_id || 0),
        video_type: rawSearch.video_type || 'censored',
        cycle: rawSearch.cycle || 'daily',
        rank: Number(rawSearch.rank || 0)
    }
    const querySearch: HomeQuerySearch = React.useMemo(() => ({
        site_id: filter.site_id || undefined,
        video_type: filter.video_type,
        cycle: filter.cycle
    }), [filter.cycle, filter.site_id, filter.video_type])
    const queryOptions = React.useMemo(() => homeQueryOptions(querySearch, t), [querySearch, t])
    const navigate = useNavigate()
    const {
        data: payload,
        isPending,
        isError,
        refetch
    } = useQuery(queryOptions);

    const videos = payload?.items.filter((item) => (item.rank || 0) >= filter.rank) || [];

    const filterFields: FilterField[] = [
        {
            dataIndex: 'video_type',
            label: t('home:ranking.filters.videoType'),
            component: (<Selector items={[
                {name: t('home:ranking.options.censored'), value: 'censored'},
                {name: t('home:ranking.options.uncensored'), value: 'uncensored'}]}
            />),
            span: {lg: 8, md: 12, xs: 24}
        },
        {
            dataIndex: 'cycle',
            label: t('home:ranking.filters.cycle'),
            component: (<Selector items={[
                {name: t('home:ranking.options.daily'), value: 'daily'},
                {name: t('home:ranking.options.weekly'), value: 'weekly'},
                {name: t('home:ranking.options.monthly'), value: 'monthly'}]}
            />),
            span: {lg: 8, md: 12, xs: 24}
        },
        {
            dataIndex: 'rank',
            label: t('home:ranking.filters.rating'),
            component: (<Slider step={0.1} min={0} max={5}/>),
            span: {lg: 8, md: 24, xs: 24}
        },
    ]

    let content: React.ReactNode;

    if (isPending) {
        content = <RoutePendingState/>;
    } else if (isError) {
        content = (
            <RouteErrorState
                title={t('home:ranking.loadTitle')}
                description={t('home:ranking.loadDescription')}
                onRetry={async () => {
                    await refetch();
                }}
            />
        );
    } else {
        content = (
            <Row className={'mt-2 cursor-pointer'} gutter={[12, 12]}>
                {videos.map((item) => (
                    <Col key={item.url} span={24} md={12} lg={6}
                         onClick={() => navigate({
                               to: '/home/detail',
                              search: {site_id: payload!.siteId, num: item.num, url: item.url}
                          })}>
                        <VideoItem item={item}/>
                    </Col>
                ))}
            </Row>
        );
    }

    return (
        <Page onRefresh={async () => {
            await refetch();
        }}>
            <Filter initialValues={filter as unknown as Record<string, unknown>} onFilterChange={(values) => {
                return navigate({search: values as never})
            }} fields={filterFields}/>
            {content}
        </Page>
    )
}

export default JavDB
