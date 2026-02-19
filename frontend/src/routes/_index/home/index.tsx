import Filter, {FilterField} from "./-components/filter.tsx";
import React from "react";
import {Col, Empty, Row, Skeleton} from "antd";
import VideoItem from "./-components/item.tsx";
import Selector from "../../../components/Selector";
import Slider from "../../../components/Slider";
import * as api from "../../../apis/home.ts";
import * as siteApi from "../../../apis/site.ts";
import type {GetRankingsParams} from "../../../apis/home.ts";
import type {SiteItem} from "../../../apis/site.ts";
import type {SiteVideo} from "../../../types/video.ts";
import {Await, createFileRoute, redirect, useNavigate} from "@tanstack/react-router";

type HomeSearch = GetRankingsParams & { rank: number };
type HomeLoaderData = { siteId: number; items: SiteVideo[] };

export const Route = createFileRoute('/_index/home/')({
    component: JavDB,
    beforeLoad: ({search}) => {
        if (Object.keys(search).length === 0) {
            throw redirect({search: {video_type: 'censored', cycle: 'daily', rank: 0}})
        }
    },
    loaderDeps: ({search}) => {
        const rawSearch = search as Partial<HomeSearch>
        return {...rawSearch, rank: Number(rawSearch.rank || 0)} as HomeSearch
    },
    loader: async ({deps}) => ({
        data: siteApi.getSites().then((sites) => {
            const rankingSites = sites.filter((item: SiteItem) => item.capabilities.supports_ranking)
            const preferredSite = rankingSites.find((item: SiteItem) => item.spider_key === 'javdb') || rankingSites[0]
            const siteId = deps.site_id || preferredSite?.id

            if (!siteId) {
                return {siteId: 0, items: []} as HomeLoaderData
            }

            return api.getRankings({...deps, site_id: siteId}).then((items) => ({siteId, items} as HomeLoaderData))
        }).catch(() => {
            return {siteId: 0, items: []} as HomeLoaderData
        })
    }),
    staleTime: Infinity
})

function JavDB() {
    const {data} = Route.useLoaderData()
    const filter = Route.useSearch() as HomeSearch
    const navigate = useNavigate()

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
            <Await promise={data} fallback={(
                <Skeleton active/>
            )}>
                {(payload: HomeLoaderData = {siteId: 0, items: []}) => {
                    const videos = payload.items.filter((item) => (item.rank || 0) >= filter.rank)
                    return videos.length > 0 ? (
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
                        <Empty className={'mt-10'}/>
                    )
                }}
            </Await>
        </div>
    )
}

export default JavDB
