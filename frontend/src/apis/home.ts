import {request} from "../utils/requests";

export async function getRankings(params: any) {
    const response = await request.request({
        url: '/home/ranking',
        method: 'get',
        params: params
    })
    return response.data
}


export async function getDetail(params: any) {
    const response = await request.request({
        url: '/home/detail',
        method: 'get',
        params: params
    })
    return response.data
}

export async function getActor(params: any) {
    const response = await request.request({
        url: '/home/actor',
        method: 'get',
        params: params
    })
    return response.data
}
