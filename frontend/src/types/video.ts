export interface SourceRef {
    site_id: number;
    spider_key: 'javdb' | 'javbus' | 'jav321' | 'dmm';
    site_name: string;
}

export interface VideoActor {
    name?: string;
    thumb?: string;
    code?: string;
}

export interface SiteVideo {
    cover?: string;
    num?: string;
    title?: string;
    publish_date?: string;
    rank?: number;
    rank_count?: number;
    isZh?: boolean;
    url?: string;
}

export interface VideoPreviewItem {
    type?: string;
    thumb?: string;
    url?: string;
}

export interface VideoPreview {
    source: SourceRef;
    items: VideoPreviewItem[];
}

export interface VideoCommentItem {
    id: string;
    name?: string;
    score?: number;
    publish_date?: string;
    content?: string;
    likes?: number;
}

export interface VideoComment {
    source: SourceRef;
    items: VideoCommentItem[];
}

export interface VideoDownload {
    is_hd: boolean;
    is_zh: boolean;
    is_uncensored: boolean;
    name?: string;
    source: SourceRef;
    url?: string;
    size?: string;
    magnet?: string;
    publish_date?: string;
}

export interface VideoSiteActor {
    source: SourceRef;
    items: VideoActor[];
}

export interface VideoDetail {
    title?: string;
    num?: string;
    rating?: string;
    premiered?: string;
    outline?: string;
    runtime?: string;
    director?: string;
    actors: VideoActor[];
    studio?: string;
    publisher?: string;
    tags: string[];
    series?: string;
    cover?: string;
    poster?: string;
    fanart?: string;
    thumb?: string;
    website: string[];
    path?: string;
    is_zh: boolean;
    is_uncensored: boolean;
    downloads: VideoDownload[];
    previews: VideoPreview[];
    comments: VideoComment[];
    site_actors: VideoSiteActor[];
}

export interface PagedResponse<T> {
    success: boolean;
    details?: string;
    data: T;
    total?: number;
    page?: number;
    limit?: number;
}
