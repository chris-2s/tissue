import {request} from "../utils/requests";

export async function getRankings(params: any) {
    const response = await request.request({
        url: '/home/ranking',
        method: 'get',
        params: params
    })
    return response.data
}


export async function getRankingDetail(params: any) {
    const response = await request.request({
        url: '/home/ranking/detail',
        method: 'get',
        params: params
    })
    return response.data
}
