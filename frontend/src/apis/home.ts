import {request} from "../utils/requests";
import type {SiteVideo, VideoDetail} from "../types/video";

export interface GetRankingsParams {
    site_id: number;
    video_type: string;
    cycle: string;
}

export interface GetNumberDetailParams {
    num: string;
}

export interface GetSiteDetailParams {
    site_id: number;
    num: string;
    url: string;
}

export type GetDetailParams = GetNumberDetailParams | GetSiteDetailParams;

export async function getRankings(params: GetRankingsParams): Promise<SiteVideo[]> {
    const response = await request.request({
        url: '/home/ranking',
        method: 'get',
        params: params
    })
    return response.data
}


export async function getDetail(params: GetDetailParams): Promise<VideoDetail> {
    const response = await request.request({
        url: '/home/detail',
        method: 'get',
        params: params
    })
    return response.data
}
