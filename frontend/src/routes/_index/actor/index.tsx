import React from "react";
import {Col, Empty, Pagination, Row, Skeleton} from "antd";
import * as api from "../../../apis/home.ts";
import {Await, createFileRoute, redirect, useNavigate, useSearch} from "@tanstack/react-router";
import VideoItem from "../home/-components/item.tsx";

export const Route = createFileRoute('/_index/actor/')({
    component: Actor,
    loaderDeps: ({search}) => search,
    loader: async ({deps}) => ({
        data: api.getActor({...deps}).catch(() => {
        })
    }),
    staleTime: Infinity
})

function Actor() {
    const {data} = Route.useLoaderData()
    const search = Route.useSearch() as any
    const navigate = useNavigate()

    return (
        <div>
            <Await promise={data} fallback={(
                <Skeleton active/>
            )}>
                {(data = []) => {
                    const videos = data.data
                    return videos.length > 0 ? (
                        <Row className={'mt-2 cursor-pointer'} gutter={[12, 12]}>
                            {videos.map((item: any) => (
                                <Col key={item.url} span={24} md={12} lg={6}
                                     onClick={() => navigate({
                                         to: '/home/detail',
                                         search: {source: search.source, num: item.num, url: item.url}
                                     })}>
                                    <VideoItem item={item}/>
                                </Col>
                            ))}
                            <div className={'w-full flex justify-center'}>
                                <Pagination pageSize={data.limit} current={data.page} total={data.total}
                                            showSizeChanger={false}
                                            onChange={(page) => {
                                                navigate({search: {...search, page: page} as any})
                                            }}/>
                            </div>
                        </Row>
                    ) : (
                        <Empty className={'mt-10'}/>
                    )
                }}
            </Await>
        </div>
    )
}

export default Actor
