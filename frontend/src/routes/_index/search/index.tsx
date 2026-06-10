import {
    Alert,
    Avatar,
    Badge,
    Button,
    Card,
    Col,
    Empty,
    Input,
    List,
    Rate,
    Row,
    Select,
    Skeleton,
    Space,
    Tag,
    Divider,
    theme,
    Typography
} from "antd";
import React, {useEffect, useMemo, useState} from "react";
import {HistoryOutlined, UserOutlined} from "@ant-design/icons";
import {createFileRoute, useRouter} from "@tanstack/react-router";
import * as searchApi from "../../../apis/search.ts";
import * as videoApi from "../../../apis/video.ts";
import Await from "../../../components/Await";
import VideoCover from "../../../components/VideoCover";
import HistoryModal from "./-components/historyModal.tsx";
import {LazyLoadImage} from "react-lazy-load-image-component";

const {Text} = Typography;
const {useToken} = theme;

type SearchMode = 'video' | 'actor';

const historyKeys: Record<SearchMode, string> = {
    video: 'search_keyword_histories_v2',
    actor: 'search_actor_keyword_histories_v1',
};

type SearchRouteSearch = {
    mode?: SearchMode;
    keyword?: string;
};

type VideoCandidate = {
    num: string;
    title: string;
    publish_date: string;
    rank: number;
    rank_count: number;
    isZh: boolean;
    cover?: string;
    url: string;
    site_id: number;
    site_name?: string;
    site_names: string[];
};

type ActorCandidate = {
    name: string;
    code: string;
    thumb?: string;
    site_id: number;
    site_name?: string;
};

type SearchResultGroup = {
    siteId: number;
    siteName: string;
    videoItems: VideoCandidate[];
    actorItems: ActorCandidate[];
};

type SearchLoaderResult = {
    mode: SearchMode;
    keyword: string;
    groups: SearchResultGroup[];
    videoItems: VideoCandidate[];
    isPlaceholder: boolean;
};

function normalizeSearch(search: SearchRouteSearch): { mode: SearchMode; keyword: string } {
    return {
        mode: search.mode === 'actor' ? 'actor' : 'video',
        keyword: (search.keyword || '').trim()
    };
}

function cacheSearchHistory(mode: SearchMode, keyword: string) {
    if (!keyword) {
        return;
    }
    const cacheKey = historyKeys[mode];
    const histories: string[] = JSON.parse(localStorage.getItem(cacheKey) || '[]')
        .filter((item: string) => item.toUpperCase() !== keyword.toUpperCase());
    localStorage.setItem(cacheKey, JSON.stringify([keyword, ...histories.slice(0, 19)]));
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
                isPlaceholder: true
            } as SearchLoaderResult);
        } else if (deps.mode === 'actor') {
            data = searchApi.searchActors(deps.keyword).then((actors) => {
                cacheSearchHistory(deps.mode, deps.keyword);
                return {
                    mode: deps.mode,
                    keyword: deps.keyword,
                    groups: groupActors(actors),
                    videoItems: [],
                    isPlaceholder: false
                } as SearchLoaderResult;
            }).catch(() => ({
                mode: deps.mode,
                keyword: deps.keyword,
                groups: [],
                videoItems: [],
                isPlaceholder: false
            } as SearchLoaderResult));
        } else {
            data = searchApi.searchVideos(deps.keyword).then((videos) => {
                cacheSearchHistory(deps.mode, deps.keyword);
                return {
                    mode: deps.mode,
                    keyword: deps.keyword,
                    groups: [],
                    videoItems: aggregateVideos(videos),
                    isPlaceholder: false
                } as SearchLoaderResult;
            }).catch(() => ({
                mode: deps.mode,
                keyword: deps.keyword,
                groups: [],
                videoItems: [],
                isPlaceholder: false
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

    const [mode, setMode] = useState<SearchMode>(submittedMode);
    const [keywordInput, setKeywordInput] = useState(normalized.keyword);
    const [historyModalOpen, setHistoryModalOpen] = useState(false);

    useEffect(() => {
        setMode(submittedMode);
        setKeywordInput(normalized.keyword);
    }, [normalized.keyword, submittedMode]);

    function runSearch(nextMode: SearchMode, nextKeyword: string, replace = true) {
        return router.navigate({
            replace,
            search: {mode: nextMode, keyword: nextKeyword.trim()} as never
        });
    }

    function renderVideoItem(item: VideoCandidate) {
        const content = (
            <div
                className="overflow-hidden rounded-lg transition-shadow hover:shadow-lg hover:border-0 cursor-pointer"
                style={{background: token.colorBorderBg, border: `1px solid ${token.colorBorderSecondary}`}}
                onClick={() => router.navigate({
                    to: '/home/detail',
                    search: {num: item.num} as never
                })}
            >
                <div>
                    <VideoCover src={item.cover} num={item.num}/>
                </div>
                <div className={'p-3'}>
                    <div className={'text-nowrap overflow-y-scroll'} style={{
                        scrollbarWidth: 'none',
                        fontSize: token.fontSizeHeading5,
                        fontWeight: token.fontWeightStrong
                    }}>
                        {item.num} {item.title}
                    </div>
                    <div className={'flex items-center my-2'}>
                        <Rate disabled allowHalf value={item.rank}></Rate>
                        <div className={'mx-1'}>{item.rank}分</div>
                        <div>由{item.rank_count}人评价</div>
                    </div>
                    <div className={'flex items-center'}>
                        <div className={'flex-1'}>{item.publish_date}</div>
                        <Space size={[4, 4]} wrap>
                            {item.site_names.map((siteName) => (
                                <Tag bordered={false} key={siteName}>{siteName}</Tag>
                            ))}
                        </Space>
                    </div>
                </div>
            </div>
        );

        return item.isZh ? <Badge.Ribbon text={'中文'}>{content}</Badge.Ribbon> : content;
    }

    function renderActorItem(item: ActorCandidate) {
        return (
            <List.Item className={'cursor-pointer'}
                       onClick={() => router.navigate({
                           to: '/actor',
                           search: {site_id: item.site_id, code: item.code} as never
                       })}>
                <List.Item.Meta
                    avatar={item.thumb ? (
                        <div className={'h-14 w-14 overflow-hidden rounded-full bg-black/5'}>
                            <LazyLoadImage className={'h-full w-full object-contain'} src={videoApi.getVideoCover(item.thumb)}/>
                        </div>
                    ) : (
                        <Avatar size={56} icon={<UserOutlined/>}>
                            {item.name.slice(0, 1).toUpperCase()}
                        </Avatar>
                    )}
                    title={item.name}
                    description={item.site_name ? <Tag bordered={false}>{item.site_name}</Tag> : undefined}
                />
            </List.Item>
        );
    }

    return (
        <Row gutter={[15, 15]}>
            <Col span={24}>
                <Card>
                    <div className={'flex gap-2'}>
                        <Select<SearchMode>
                            value={mode}
                            className={'w-20'}
                            options={[
                                {label: '影片', value: 'video'},
                                {label: '演员', value: 'actor'}
                            ]}
                            onChange={(value) => {
                                setMode(value);
                            }}
                        />
                        <Input.Search
                            className={'flex-1'}
                            placeholder={mode === 'video' ? '请输入影片' : '请输入演员名称'}
                            enterButton
                            allowClear
                            value={keywordInput}
                            onChange={(event) => setKeywordInput(event.target.value)}
                            onSearch={(value) => runSearch(mode, value)}
                        />
                        <Button type={'primary'}
                                icon={<HistoryOutlined/>}
                                onClick={() => setHistoryModalOpen(true)}/>
                    </div>
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
                                        description={submittedMode === 'video' ? '输入影片后展示搜索结果' : '输入演员名称后展示搜索结果'}
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
                                <Space direction={'vertical'} size={16} className={'w-full'}>
                                    {result.isPlaceholder && (
                                        <Alert
                                            type={'info'}
                                            showIcon
                                            message={'当前结果为前端布局占位数据，后续接口接入后替换'}
                                        />
                                    )}
                                    <Row gutter={[12, 12]}>
                                        {result.videoItems.map((item) => (
                                            <Col key={item.num} span={24} md={12} lg={6}>
                                                {renderVideoItem(item)}
                                            </Col>
                                        ))}
                                    </Row>
                                </Space>
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
                                {result.isPlaceholder && (
                                    <Alert
                                        type={'info'}
                                        showIcon
                                        message={'当前结果为前端布局占位数据，后续接口接入后替换'}
                                    />
                                )}
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
                                            renderItem={(item) => renderActorItem(item)}
                                        />
                                        <Divider className={'mb-0 mt-4'}/>
                                    </div>
                                ))}
                            </Space>
                        );
                    }}
                </Await>
            </Col>
            <HistoryModal
                open={historyModalOpen}
                cacheKey={historyKeys[submittedMode]}
                onCancel={() => setHistoryModalOpen(false)}
                onClick={(keyword) => {
                    setHistoryModalOpen(false);
                    setKeywordInput(keyword);
                    runSearch(submittedMode, keyword);
                }}
            />
        </Row>
    );
}

export default Search;
