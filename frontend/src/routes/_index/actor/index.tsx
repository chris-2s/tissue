import {queryOptions, useSuspenseQuery} from "@tanstack/react-query";
import React, {useEffect} from "react";
import {Col, Empty, Pagination, Row} from "antd";
import * as api from "../../../apis/home.ts";
import {createFileRoute, type ErrorComponentProps, useNavigate, useRouter} from "@tanstack/react-router";
import RouteErrorState from "../../../components/RouteErrorState";
import RoutePendingState from "../../../components/RoutePendingState";
import {useDispatch} from "react-redux";
import VideoItem from "../home/-components/item.tsx";
import type {Dispatch} from "../../../models";

type ActorSearch = {
    site_id: number;
    code: string;
    page?: number;
};

function actorQueryOptions(search: ActorSearch) {
    return queryOptions({
        queryKey: ['actorVideos', search] as const,
        staleTime: 10 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        retry: 0,
        queryFn: () => api.getActor(search)
    });
}

function ActorError(props: ErrorComponentProps) {
    const router = useRouter();

    return (
        <RouteErrorState
            title={'演员作品加载失败'}
            description={'请检查网络或站点状态后重试'}
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
})

function Actor() {
    const search = Route.useSearch() as ActorSearch
    const normalizedSearch: ActorSearch = {
        ...search,
        page: Number(search.page || 1)
    }
    const {data: pageData} = useSuspenseQuery(actorQueryOptions(normalizedSearch))
    const navigate = useNavigate()
    const appDispatch = useDispatch<Dispatch>().app

    useEffect(() => {
        appDispatch.setCanBack(true)
        return () => {
            appDispatch.setCanBack(false)
        }
    }, [appDispatch])

    const videos = pageData.data || []

    return (
        <div>
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
                        <Pagination pageSize={pageData.limit} current={pageData.page} total={pageData.total}
                                    showSizeChanger={false}
                                    onChange={(page) => {
                                        navigate({search: {...normalizedSearch, page} as never})
                                    }}/>
                    </div>
                </Row>
            ) : (
                <Empty className={'mt-10'}/>
            )}
        </div>
    )
}

export default Actor
