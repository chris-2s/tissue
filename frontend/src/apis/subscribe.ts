import {request} from "../utils/requests";

export async function getSubscribes() {
    const response = await request.request({
        url: '/subscribe/',
        method: 'get'
    })
    return response.data.data
}

export function modifySubscribe(data: any) {
    return request.request({
        url: '/subscribe/',
        method: data.id ? 'put' : 'post',
        data: data
    })
}

export function deleteSubscribe(id: number) {
    return request.request({
        url: '/subscribe/',
        method: 'delete',
        params: {subscribe_id: id},
    })
}
