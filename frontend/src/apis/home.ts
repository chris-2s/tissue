import {request} from "../utils/requests";

export async function getCpuPercent() {
    const response = await request.request({
        url: '/home/cpu',
        method: 'get'
    })
    return response.data
}

export async function getMemoryInfo() {
    const response = await request.request({
        url: '/home/memory',
        method: 'get'
    })
    return response.data
}

export async function getVideoInfo() {
    const response = await request.request({
        url: '/home/video',
        method: 'get'
    })
    return response.data
}

export async function getDiskSpace() {
    const response = await request.request({
        url: '/home/disk',
        method: 'get'
    })
    return response.data
}


export async function getDownloadInfo() {
    const response = await request.request({
        url: '/home/download',
        method: 'get'
    })
    return response.data
}
