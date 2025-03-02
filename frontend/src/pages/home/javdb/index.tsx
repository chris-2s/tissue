import Filter, {FilterField} from "../filter.tsx";
import Selector from "../../../components/Selector";
import React, {useEffect, useState} from "react";
import Slider from "../../../components/Slider";
import {Col, Empty, Row, Skeleton} from "antd";
import JavDBItem from "./item.tsx";
import * as api from "../../../apis/home.ts";
import {clearCache, useRequest} from "ahooks";

const cacheKey = 'javdb-rankings'

function JavDB() {
    const {run, loading, data = [], params} = useRequest(api.getJavdbRankings, {
        manual: true,
        staleTime: -1,
        cacheKey: cacheKey,
    })

    const [filter, setFilter] = useState<any>(params.length > 0 ? params[0] : {
        video_type: 'censored', cycle: 'daily', rank: 0
    })

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
            component: (<Slider step={0.1} min={0} max={5} />),
            span: {lg: 8, md: 24, xs: 24}
        },
    ]

    useEffect(() => {
        run(filter)
    }, [filter.video_type, filter.cycle])

    const videos = data.filter((item: any) => item.rank >= filter.rank)

    return (
        <div>
            <Filter initialValues={filter} onChange={(values, field) => {
                if (field !== 'rank') {
                    clearCache(cacheKey)
                }
                setFilter(values)
            }} fields={filterFields}/>
            {loading ? (
                <Skeleton active/>
            ) : (
                videos ? (
                    <Row className={'mt-2'} gutter={[12, 12]}>
                        {videos.map((item: any) => (
                            <Col key={item.url} span={24} md={12} lg={6}><JavDBItem item={item}/></Col>
                        ))}
                    </Row>
                ) : (
                    <Empty/>
                )
            )}
        </div>
    )
}

export default JavDB
