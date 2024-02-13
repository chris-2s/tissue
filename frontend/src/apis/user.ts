import {request} from "../utils/requests";

export async function getUsers(params: any, extra: any) {
    let response = await request.request({
        url: '/user/list',
        method: 'get',
        params: {...params, ...extra}
    });
    return ({
        list: response.data.data,
        total: 0
    });
}

export function modifyUser(data: any) {
    return request.request({
        url: '/user/',
        method: data.id ? 'put' : 'post',
        data: data
    })
}
