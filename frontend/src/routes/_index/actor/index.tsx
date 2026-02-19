import React from "react";
import {Col, Empty, Pagination, Row, Skeleton} from "antd";
import * as api from "../../../apis/home.ts";
import {Await, createFileRoute, useNavigate} from "@tanstack/react-router";
import VideoItem from "../home/-components/item.tsx";
import type {PagedResponse, SiteVideo} from "../../../types/video.ts";

type ActorSearch = {
    site_id: number;
    code: string;
    page?: number;
};

type ActorPageResponse = PagedResponse<SiteVideo[]>;

export const Route = createFileRoute('/_index/actor/')({
    component: Actor,
    loaderDeps: ({search}) => search as ActorSearch,
    loader: async ({deps}) => ({
        data: api.getActor({...deps}).catch(() => ({success: true, data: []} as ActorPageResponse))
    }),
    staleTime: Infinity
})

function Actor() {
    const {data} = Route.useLoaderData()
    const search = Route.useSearch() as ActorSearch
    const navigate = useNavigate()

    return (
        <div>
            <Await promise={data} fallback={(
                <Skeleton active/>
            )}>
                {(pageData: ActorPageResponse = {success: true, data: []}) => {
                    const videos = pageData.data || []
                    return videos.length > 0 ? (
                        <Row className={'mt-2 cursor-pointer'} gutter={[12, 12]}>
                            {videos.map((item) => (
                                <Col key={item.url} span={24} md={12} lg={6}
                                 onClick={() => navigate({
                                          to: '/home/detail',
                                          search: {site_id: search.site_id, num: item.num, url: item.url}
                                      })}>
                                    <VideoItem item={item}/>
                                </Col>
                            ))}
                            <div className={'w-full flex justify-center'}>
                                <Pagination pageSize={pageData.limit} current={pageData.page} total={pageData.total}
                                            showSizeChanger={false}
                                            onChange={(page) => {
                                                navigate({search: {...search, page} as never})
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
