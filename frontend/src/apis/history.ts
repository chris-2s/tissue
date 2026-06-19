import {request} from "../utils/requests";

export interface GetHistoriesParams {
    page?: number;
    limit?: number;
    keyword?: string;
}

export async function getHistories(params: GetHistoriesParams = {}) {
    const response = await request.request({
        url: '/history/',
        method: 'get',
        params
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
