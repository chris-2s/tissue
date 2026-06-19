import Filter, {FilterField} from "./-components/filter.tsx";
import {queryOptions, useQuery} from "@tanstack/react-query";
import React from "react";
import {Button, Col, Empty, Row} from "antd";
import VideoItem from "./-components/item.tsx";
import Selector from "../../../components/Selector";
import Slider from "../../../components/Slider";
import * as api from "../../../apis/home.ts";
import * as siteApi from "../../../apis/site.ts";
import type {GetRankingsParams} from "../../../apis/home.ts";
import type {SiteItem} from "../../../apis/site.ts";
import type {SiteVideo} from "../../../types/video.ts";
import {createFileRoute, redirect, useNavigate} from "@tanstack/react-router";
import RouteErrorState from "../../../components/RouteErrorState";
import RoutePendingState from "../../../components/RoutePendingState";

type HomeSearch = GetRankingsParams & { rank: number };
type HomeQuerySearch = Omit<GetRankingsParams, 'site_id'> & { site_id?: number };
type HomeLoaderData = { siteId: number; items: SiteVideo[] };

function homeQueryOptions(search: HomeQuerySearch) {
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
                throw new Error('未获取到榜单数据，请检查站点 Cookie 或站点状态。');
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
    const rawSearch = Route.useSearch() as Partial<HomeSearch>
    const filter: HomeSearch = {
        site_id: Number(rawSearch.site_id || 0),
        video_type: rawSearch.video_type || 'censored',
        cycle: rawSearch.cycle || 'daily',
        rank: Number(rawSearch.rank || 0)
    }
    const querySearch: HomeQuerySearch = {
        site_id: filter.site_id || undefined,
        video_type: filter.video_type,
        cycle: filter.cycle
    }
    const navigate = useNavigate()
    const {
        data: payload,
        isPending,
        isError,
        refetch,
        isFetching
    } = useQuery(homeQueryOptions(querySearch));

    const videos = payload?.items.filter((item) => (item.rank || 0) >= filter.rank) || [];

    const filterFields: FilterField[] = [
        {
            dataIndex: 'video_type',
            label: '类型',
            component: (<Selector items={[
                {name: '有码', value: 'censored'},
                {name: '无码', value: 'uncensored'}]}
            />),
            span: {lg: 8, md: 12, xs: 24}
        },
        {
            dataIndex: 'cycle',
            label: '周期',
            component: (<Selector items={[
                {name: '日榜', value: 'daily'},
                {name: '周榜', value: 'weekly'},
                {name: '月榜', value: 'monthly'}]}
            />),
            span: {lg: 8, md: 12, xs: 24}
        },
        {
            dataIndex: 'rank',
            label: '评分',
            component: (<Slider step={0.1} min={0} max={5}/>),
            span: {lg: 8, md: 24, xs: 24}
        },
    ]

    return (
        <div>
            <Filter initialValues={filter as unknown as Record<string, unknown>} onFilterChange={(values) => {
                return navigate({search: values as never})
            }} fields={filterFields}/>
            {isPending ? (
                <RoutePendingState/>
            ) : isError ? (
                <RouteErrorState
                    title={'榜单加载失败'}
                    description={'请检查站点配置、Cookie 或网络状态后重试'}
                    onRetry={async () => {
                        await refetch();
                    }}
                />
            ) : videos.length > 0 ? (
                <Row className={'mt-2 cursor-pointer'} gutter={[12, 12]}>
                    {videos.map((item) => (
                        <Col key={item.url} span={24} md={12} lg={6}
                             onClick={() => navigate({
                                   to: '/home/detail',
                                  search: {site_id: payload.siteId, num: item.num, url: item.url}
                              })}>
                            <VideoItem item={item}/>
                        </Col>
                    ))}
                </Row>
            ) : (
                <div className={'mt-10'}>
                    <Empty/>
                    {isFetching && (
                        <div className={'mt-4 text-center'}>
                            <Button loading type={'default'}>
                                正在刷新榜单
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default JavDB
