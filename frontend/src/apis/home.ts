import {request} from "../utils/requests";

export async function getJavdbRankings(params: any) {
    const response = await request.request({
        url: '/home/javdb',
        method: 'get',
        params: params
    })
    return response.data
}
