import {
    Card,
    Col,
    Divider,
    Empty,
    List,
    Row,
    Skeleton,
    Space,
    theme,
    Typography
} from "antd";
import React, {useMemo} from "react";
import {createFileRoute, useRouter} from "@tanstack/react-router";
import * as searchApi from "../../../apis/search.ts";
import Await from "../../../components/Await";
import ActorResultItem from "./-components/actorResultItem.tsx";
import SearchPanel from "./-components/searchPanel.tsx";
import {
    type SearchLoaderResult,
    type SearchMode,
    type SearchResultGroup,
    type SearchRouteSearch,
    type VideoCandidate
} from "./-components/types.ts";
import VideoResultCard from "./-components/videoResultCard.tsx";

const {Text} = Typography;
const {useToken} = theme;

function normalizeSearch(search: SearchRouteSearch): { mode: SearchMode; keyword: string } {
    return {
        mode: search.mode === 'actor' ? 'actor' : 'video',
        keyword: (search.keyword || '').trim()
    };
}

function groupActors(actors: searchApi.ActorSearchItem[]): SearchResultGroup[] {
    const groupMap = new Map<number, SearchResultGroup>();

    for (const actor of actors) {
        const source = actor.source;
        if (!source?.site_id) {
            continue;
        }

        const group = groupMap.get(source.site_id) || {
            siteId: source.site_id,
            siteName: source.site_name,
            videoItems: [],
            actorItems: [],
        };

        group.actorItems.push({
            name: actor.name || '',
            code: actor.code || '',
            thumb: actor.thumb,
            site_id: source.site_id,
            site_name: source.site_name,
        });

        groupMap.set(source.site_id, group);
    }

    return Array.from(groupMap.values());
}

function aggregateVideos(videos: searchApi.VideoSearchItem[]): VideoCandidate[] {
    const videoMap = new Map<string, VideoCandidate>();

    for (const video of videos) {
        const num = (video.num || '').trim();
        if (!num) {
            continue;
        }

        const key = num.toUpperCase();
        const existing = videoMap.get(key);
        if (existing) {
            if (video.isZh) {
                existing.isZh = true;
            }
            if (!existing.rank && video.rank) {
                existing.rank = video.rank;
            }
            if (!existing.rank_count && video.rank_count) {
                existing.rank_count = video.rank_count;
            }
            if (video.source?.site_name && !existing.site_names.includes(video.source.site_name)) {
                existing.site_names.push(video.source.site_name);
            }
            continue;
        }

        videoMap.set(key, {
            num,
            title: video.title || '',
            publish_date: video.publish_date || '',
            rank: video.rank || 0,
            rank_count: video.rank_count || 0,
            isZh: !!video.isZh,
            cover: video.cover,
            url: video.url || '',
            site_id: video.source?.site_id || 0,
            site_name: video.source?.site_name,
            site_names: video.source?.site_name ? [video.source.site_name] : [],
        });
    }

    return Array.from(videoMap.values());
}

export const Route = createFileRoute('/_index/search/')({
    component: Search,
    loaderDeps: ({search}) => normalizeSearch(search as SearchRouteSearch),
    loader: async ({deps}) => {
        let data: Promise<SearchLoaderResult>;

        if (!deps.keyword) {
            data = Promise.resolve({
                mode: deps.mode,
                keyword: deps.keyword,
                groups: [],
                videoItems: [],
            } as SearchLoaderResult);
        } else if (deps.mode === 'actor') {
            data = searchApi.searchActors(deps.keyword).then((actors) => ({
                mode: deps.mode,
                keyword: deps.keyword,
                groups: groupActors(actors),
                videoItems: [],
            } as SearchLoaderResult)).catch(() => ({
                mode: deps.mode,
                keyword: deps.keyword,
                groups: [],
                videoItems: [],
            } as SearchLoaderResult));
        } else {
            data = searchApi.searchVideos(deps.keyword).then((videos) => ({
                mode: deps.mode,
                keyword: deps.keyword,
                groups: [],
                videoItems: aggregateVideos(videos),
            } as SearchLoaderResult)).catch(() => ({
                mode: deps.mode,
                keyword: deps.keyword,
                groups: [],
                videoItems: [],
            } as SearchLoaderResult));
        }

        return {data};
    },
    staleTime: Infinity
});

function Search() {
    const router = useRouter();
    const {token} = useToken();
    const search = Route.useSearch() as SearchRouteSearch;
    const {data: loaderData} = Route.useLoaderData();
    const normalized = useMemo(() => normalizeSearch(search), [search]);
    const submittedMode = normalized.mode;
    const submittedKeyword = normalized.keyword;

    function runSearch(nextMode: SearchMode, nextKeyword: string, replace = true) {
        const keyword = nextKeyword.trim();
        return router.navigate({
            replace,
            search: keyword ? {mode: nextMode, keyword} as never : {} as never
        });
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
                <Await promise={loaderData}>
                    {(result: SearchLoaderResult | undefined, loading) => {
                        if (loading) {
                            return (
                                <Card>
                                    <Skeleton active paragraph={{rows: 8}}/>
                                </Card>
                            );
                        }

                        if (!result?.keyword) {
                            return (
                                <Card>
                                    <Empty
                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                        description={'输入关键词后可选择搜索影片或演员'}
                                    />
                                </Card>
                            );
                        }

                        if (submittedMode === 'video') {
                            if (!result.videoItems.length) {
                                return (
                                    <Card>
                                        <Empty description={'暂无搜索结果'}/>
                                    </Card>
                                );
                            }

                            return (
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
                            );
                        }

                        if (!result.groups.length) {
                            return (
                                <Card>
                                    <Empty description={'暂无搜索结果'}/>
                                </Card>
                            );
                        }

                        return (
                            <Space direction={'vertical'} size={16} className={'w-full'}>
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
                        );
                    }}
                </Await>
            </Col>
        </Row>
    );
}

export default Search;
