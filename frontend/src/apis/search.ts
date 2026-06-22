import {request} from "../utils/requests";
import type {SiteVideo, SourceRef} from "../types/video";

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
