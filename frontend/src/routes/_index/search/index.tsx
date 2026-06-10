import {
    Alert,
    Avatar,
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
    Tooltip,
    Typography
} from "antd";
import React, {useEffect, useMemo, useState} from "react";
import {HistoryOutlined, SearchOutlined, UserOutlined} from "@ant-design/icons";
import {createFileRoute, useRouter} from "@tanstack/react-router";
import type {SiteItem} from "../../../apis/site.ts";
import * as siteApi from "../../../apis/site.ts";
import Await from "../../../components/Await";
import VideoCover from "../../../components/VideoCover";
import HistoryModal from "./-components/historyModal.tsx";

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
};

type ActorCandidate = {
    name: string;
    code: string;
    thumb?: string;
    site_id: number;
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

function buildPlaceholderGroups(mode: SearchMode, keyword: string, sites: SiteItem[]): SearchResultGroup[] {
    const enabledSites = sites.filter((item) => mode === 'actor' ? item.capabilities.supports_actor : true);
    return enabledSites.map((site, index) => ({
        siteId: site.id,
        siteName: site.name,
        videoItems: mode === 'video' ? [{
            num: keyword.toUpperCase(),
            title: `搜索候选占位 ${site.name}`,
            publish_date: `2024-0${(index % 9) + 1}-15`,
            rank: 4.2,
            rank_count: 120 + index * 9,
            isZh: index % 2 === 0,
            cover: undefined,
            url: '',
            site_id: site.id,
        }] : [],
        actorItems: mode === 'actor' ? [{
            name: keyword,
            code: keyword,
            thumb: undefined,
            site_id: site.id,
        }] : [],
    }));
}

export const Route = createFileRoute('/_index/search/')({
    component: Search,
    loaderDeps: ({search}) => normalizeSearch(search as SearchRouteSearch),
    loader: async ({deps}) => ({
        data: deps.keyword ? siteApi.getSites().then((sites) => {
            cacheSearchHistory(deps.mode, deps.keyword);
            return {
                mode: deps.mode,
                keyword: deps.keyword,
                groups: buildPlaceholderGroups(deps.mode, deps.keyword, sites),
                isPlaceholder: true
            } as SearchLoaderResult;
        }) : Promise.resolve({
            mode: deps.mode,
            keyword: deps.keyword,
            groups: [],
            isPlaceholder: true
        } as SearchLoaderResult)
    }),
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
                    search: {site_id: item.site_id, num: item.num, url: item.url} as never
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
                        <Tooltip title={'搜索'}>
                            <div onClick={(event) => {
                                event.stopPropagation();
                                return runSearch('video', item.num);
                            }}>
                                <SearchOutlined/>
                            </div>
                        </Tooltip>
                    </div>
                </div>
            </div>
        );

        return item.isZh ? <BadgeLike text={'中文'}>{content}</BadgeLike> : content;
    }

    function renderActorItem(item: ActorCandidate) {
        return (
            <List.Item className={'cursor-pointer'}
                       onClick={() => router.navigate({
                           to: '/actor',
                           search: {site_id: item.site_id, code: item.code} as never
                       })}>
                <List.Item.Meta
                    avatar={item.thumb ? <Avatar size={56} src={item.thumb}/> : (
                        <Avatar size={56} icon={<UserOutlined/>}>
                            {item.name.slice(0, 1).toUpperCase()}
                        </Avatar>
                    )}
                    title={item.name}
                    description={<Tag bordered={false}>演员候选</Tag>}
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
                                                {submittedMode === 'video' ? group.videoItems.length : group.actorItems.length} 条结果
                                            </Text>
                                        </div>
                                        {submittedMode === 'video' ? (
                                            <Row gutter={[12, 12]}>
                                                {group.videoItems.map((item) => (
                                                    <Col key={`${group.siteId}-${item.num}`} span={24} md={12} lg={6}>
                                                        {renderVideoItem(item)}
                                                    </Col>
                                                ))}
                                            </Row>
                                        ) : (
                                            <List
                                                dataSource={group.actorItems}
                                                renderItem={(item) => renderActorItem(item)}
                                            />
                                        )}
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

function BadgeLike(props: { text: string; children: React.ReactNode }) {
    return (
        <div className={'relative'}>
            <div className={'absolute right-3 top-0 z-10 rounded-b-md bg-blue-500 px-2 py-1 text-xs text-white'}>
                {props.text}
            </div>
            {props.children}
        </div>
    );
}

export default Search;
