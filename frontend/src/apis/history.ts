import {request} from "../utils/requests";

export async function getHistories() {
    const response = await request.request({
        url: '/history/',
        method: 'get'
    })
    return response.data
}

export function deleteHistory(id: number) {
    return request.request({
        url: '/history/',
        method: 'delete',
        params: {history_id: id}
    })
}
