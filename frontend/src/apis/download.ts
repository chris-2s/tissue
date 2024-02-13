import {request} from "../utils/requests";

export async function getDownloads() {
    const response = await request.request({
        url: '/download/',
        method: 'get'
    })
    return response.data.data
}

export function completeDownload(hash: string) {
    return request.request({
        url: '/download/complete',
        method: 'get',
        params: {torrent_hash: hash}
    })
}
