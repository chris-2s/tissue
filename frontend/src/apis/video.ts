import {request} from "../utils/requests";
import configs from "../configs";

export async function getVideos(force: boolean = false) {
    const response = await request.request({
        url: '/video/',
        method: 'get',
        params: {force}
    })
    return response.data.data
}

export async function getVideoDetail(path: string) {
    const response = await request.request({
        url: '/video/detail',
        method: 'get',
        params: {path}
    })
    return response.data.data
}

export async function parseVideoNum(path: string) {
    const response = await request.request({
        url: '/video/parse',
        method: 'get',
        params: {path}
    })
    return response.data.data
}

export function getVideoCover(url: string) {
    return configs.BASE_API + '/common/cover?url=' + encodeURIComponent(url)
}

export function scrapeVideo(num: string) {
    return request.request({
        url: '/video/scrape',
        method: 'get',
        params: {num}
    })
}

export function saveVideo(data: any, mode?: string, transMode?: string) {
    return request.request({
        url: '/video/',
        method: 'post',
        params: {mode, trans_mode: transMode},
        data: data
    })
}

export function deleteVideo(path?: string) {
    return request.request({
        url: '/video/',
        method: 'delete',
        params: {path},
    })
}
