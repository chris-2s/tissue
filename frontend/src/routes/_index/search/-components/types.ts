export type SearchMode = 'video' | 'actor';

export type SearchRouteSearch = {
    mode?: SearchMode;
    keyword?: string;
};

export type VideoCandidate = {
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

export type ActorCandidate = {
    name: string;
    code: string;
    thumb?: string;
    site_id: number;
    site_name?: string;
    alias?: string[];
};

export type SearchResultGroup = {
    siteId: number;
    siteName: string;
    videoItems: VideoCandidate[];
    actorItems: ActorCandidate[];
};

export type SearchLoaderResult = {
    mode: SearchMode;
    keyword: string;
    groups: SearchResultGroup[];
    videoItems: VideoCandidate[];
};
