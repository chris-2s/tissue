import Filter, {FilterField} from "./-components/filter.tsx";
import React, {useEffect, useState} from "react";
import {Col, Empty, Row, Skeleton} from "antd";
import JavDBItem from "./-components/item.tsx";
import {clearCache, useRequest, useSessionStorageState} from "ahooks";
import Selector from "../../../components/Selector";
import Slider from "../../../components/Slider";
import * as api from "../../../apis/home.ts";
import {Await, createFileRoute, redirect, useNavigate} from "@tanstack/react-router";


const cacheKey = 'javdb-rankings'

export const Route = createFileRoute('/_index/home/')({
    component: JavDB,
    beforeLoad: ({search}) => {
        if (Object.keys(search).length === 0)
            throw redirect({search: {video_type: 'censored', cycle: 'daily', rank: 0} as any})
    },
    loaderDeps: ({search}) => ({...search, rank: 0}),
    loader: async ({deps}) => {
        return api.getJavdbRankings(deps)
    },
    staleTime: Infinity
})

function JavDB() {
    const data = Route.useLoaderData()
    const filter = Route.useSearch()
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

    const videos = data.filter((item: any) => item.rank >= filter.rank)

    return (
        <div>
            <Filter initialValues={filter} onChange={(values, field) => {
                return navigate({search: values as any})
            }} fields={filterFields}/>
            {videos ? (
                <Row className={'mt-2'} gutter={[12, 12]}>
                    {videos.map((item: any) => (
                        <Col key={item.url} span={24} md={12} lg={6}><JavDBItem item={item}/></Col>
                    ))}
                </Row>
            ) : (
                <Empty/>
            )}
        </div>
    )
}

export default JavDB
