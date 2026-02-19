import {request} from "../utils/requests";
import type {PagedResponse, SiteVideo, VideoDetail} from "../types/video";

export interface GetRankingsParams {
    site_id: number;
    video_type: string;
    cycle: string;
}

export interface GetDetailParams {
    site_id: number;
    num: string;
    url: string;
}

export interface GetActorParams {
    site_id: number;
    code: string;
    page?: number;
}

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

export async function getActor(params: GetActorParams): Promise<PagedResponse<SiteVideo[]>> {
    const response = await request.request({
        url: '/home/actor',
        method: 'get',
        params: params
    })
    return response.data
}
