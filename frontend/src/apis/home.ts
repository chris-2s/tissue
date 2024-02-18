import {request} from "../utils/requests";

export async function getSystemInfo() {
    const response = await request.request({
        url: '/home/system',
        method: 'get'
    })
    return response.data
}

export async function getVideoCount() {
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
