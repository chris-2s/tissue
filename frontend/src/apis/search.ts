import {request} from "../utils/requests";
import type {SiteVideo, SourceRef} from "../types/video";

export interface ActorSearchItem {
    code?: string;
    name?: string;
    thumb?: string;
    alias?: string[];
    source: SourceRef;
}

export async function searchActors(name: string): Promise<ActorSearchItem[]> {
    const response = await request.request({
        url: '/actor/search',
        method: 'get',
        params: {name}
    });
    return response.data.data || [];
}

export interface VideoSearchItem extends SiteVideo {
    source?: SourceRef;
}

export async function searchVideos(num: string): Promise<VideoSearchItem[]> {
    const response = await request.request({
        url: '/home/search',
        method: 'get',
        params: {num}
    });
    return response.data.data || [];
}
