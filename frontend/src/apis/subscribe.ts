import {request} from "../utils/requests";
import type {VideoDetail, VideoDownload} from "../types/video";

export interface SubscribeCreate {
    num: string;
    premiered?: string;
    title?: string;
    cover?: string;
    actors?: string;
    is_hd?: boolean;
    is_zh?: boolean;
    is_uncensored?: boolean;
    status?: number;
    include_keyword?: string;
    exclude_keyword?: string;
}

export interface Subscribe extends SubscribeCreate {
    id: number;
    update_time?: string;
    last_updated?: string;
}

export type SubscribeUpdate = Subscribe;

export async function getSubscribes(): Promise<Subscribe[]> {
    const response = await request.request({
        url: '/subscribe/',
        method: 'get'
    })
    return response.data.data
}

export async function getSubscribeHistories(): Promise<Subscribe[]> {
    const response = await request.request({
        url: '/subscribe/history',
        method: 'get'
    })
    return response.data.data
}

export function modifySubscribe(data: SubscribeCreate | SubscribeUpdate) {
    return request.request({
        url: '/subscribe/',
        method: ('id' in data && data.id) ? 'put' : 'post',
        data: data
    })
}

export function resubscribe(id: number) {
    return request.request({
        url: '/subscribe/resubscribe',
        method: 'post',
        params: {subscribe_id: id},
    })
}

export function deleteSubscribe(id: number) {
    return request.request({
        url: '/subscribe/',
        method: 'delete',
        params: {subscribe_id: id},
    })
}

export async function searchVideo(param: { num: string }): Promise<VideoDetail> {
    const response = await request.request({
        url: '/subscribe/search',
        method: 'get',
        params: param
    })
    return response.data.data
}

export async function downloadVideos(video: SubscribeCreate, link: VideoDownload) {
    const response = await request.request({
        url: '/subscribe/download',
        method: 'post',
        data: {
            video, link
        }
    })
    return response.data.data
}
