import {
    Card,
    Col,
    Divider,
    Empty,
    List,
    Row,
    Space,
    theme,
    Typography
} from "antd";
import {queryOptions, useQuery} from "@tanstack/react-query";
import React, {useMemo, useState} from "react";
import {createFileRoute, useRouter} from "@tanstack/react-router";
import * as searchApi from "../../../apis/search.ts";
import RouteErrorState from "../../../components/RouteErrorState";
import RoutePendingState from "../../../components/RoutePendingState";
import ActorResultItem from "./-components/actorResultItem.tsx";
import SearchPanel from "./-components/searchPanel.tsx";
import {
    type SearchMode,
    type SearchRouteSearch,
} from "./-components/types.ts";
import VideoResultCard from "./-components/videoResultCard.tsx";
import {aggregateVideos, groupActors, normalizeSearch} from "./-search.utils.ts";

const {Text} = Typography;
const {useToken} = theme;

function searchQueryOptions(search: SearchRouteSearch) {
    const normalized = normalizeSearch(search);

    return queryOptions({
        queryKey: ['searchResult', normalized] as const,
        staleTime: 10 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        retry: 0,
        queryFn: async () => {
            if (!normalized.keyword) {
                return {
                    mode: normalized.mode,
                    keyword: normalized.keyword,
                    groups: [],
                    videoItems: [],
                };
            }

            if (normalized.mode === 'actor') {
                const actors = await searchApi.searchActors(normalized.keyword);
                return {
                    mode: normalized.mode,
                    keyword: normalized.keyword,
                    groups: groupActors(actors),
                    videoItems: [],
                };
            }

            const videos = await searchApi.searchVideos(normalized.keyword);
            return {
                mode: normalized.mode,
                keyword: normalized.keyword,
                groups: [],
                videoItems: aggregateVideos(videos),
            };
        }
    });
}

export const Route = createFileRoute('/_index/search/')({
    component: Search,
});

function Search() {
    const router = useRouter();
    const {token} = useToken();
    const search = Route.useSearch() as SearchRouteSearch;
    const normalized = useMemo(() => normalizeSearch(search), [search]);
    const submittedMode = normalized.mode;
    const submittedKeyword = normalized.keyword;
    const {data: result, isPending, isError, refetch} = useQuery(searchQueryOptions(search));
    const [manualSearching, setManualSearching] = useState(false);

    async function runSearch(nextMode: SearchMode, nextKeyword: string, replace = true) {
        const keyword = nextKeyword.trim();

        if (keyword && nextMode === submittedMode && keyword === submittedKeyword) {
            setManualSearching(true);
            try {
                await refetch();
            } finally {
                setManualSearching(false);
            }
            return;
        }

        return router.navigate({
            replace,
            search: keyword ? {mode: nextMode, keyword} as never : {} as never
        });
    }

    let content: React.ReactNode;

    if (isPending || manualSearching) {
        content = (
            <Card>
                <RoutePendingState/>
            </Card>
        );
    } else if (isError) {
        content = (
            <RouteErrorState
                title={'搜索失败'}
                description={'请检查网络或关键词后重试。'}
                onRetry={async () => {
                    await refetch();
                }}
            />
        );
    } else if (!result?.keyword) {
        content = (
            <Card>
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={'输入关键词后可选择搜索影片或演员'}
                />
            </Card>
        );
    } else if (submittedMode === 'video') {
        content = result.videoItems.length > 0 ? (
            <Row gutter={[12, 12]}>
                {result.videoItems.map((item) => (
                    <Col key={item.num} span={24} md={12} lg={6}>
                        <VideoResultCard
                            item={item}
                            onClick={() => router.navigate({
                                to: '/home/detail',
                                search: {num: item.num} as never
                            })}
                        />
                    </Col>
                ))}
            </Row>
        ) : (
            <Card>
                <Empty description={'暂无搜索结果'}/>
            </Card>
        );
    } else {
        content = result.groups.length > 0 ? (
            <Space orientation={'vertical'} size={16} className={'w-full'}>
                {result.groups.map((group) => (
                    <div key={group.siteId}
                         className={'rounded-xl p-4'}
                         style={{background: token.colorBgContainer}}>
                        <div className={'mb-4 flex items-center justify-between'}>
                            <Text strong>{group.siteName}</Text>
                            <Text type={'secondary'}>
                                {group.actorItems.length} 条结果
                            </Text>
                        </div>
                        <List
                            dataSource={group.actorItems}
                            renderItem={(item) => (
                                <ActorResultItem
                                    item={item}
                                    onClick={() => router.navigate({
                                        to: '/actor',
                                        search: {site_id: item.site_id, code: item.code} as never
                                    })}
                                />
                            )}
                        />
                        <Divider className={'mb-0 mt-4'}/>
                    </div>
                ))}
            </Space>
        ) : (
            <Card>
                <Empty description={'暂无搜索结果'}/>
            </Card>
        );
    }

    return (
        <Row gutter={[15, 15]}>
            <Col span={24}>
                <Card>
                    <SearchPanel
                        submittedKeyword={submittedKeyword}
                        onSubmitActor={(keyword) => runSearch('actor', keyword)}
                        onSubmitVideo={(keyword) => runSearch('video', keyword)}
                    />
                </Card>
            </Col>
            <Col span={24}>
                {content}
            </Col>
        </Row>
    );
}

export default Search;
