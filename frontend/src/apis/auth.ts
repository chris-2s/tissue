import {request} from "../utils/requests";
import qs from 'qs';

export function login(data: any) {
    return request.request({
        url: '/auth/login',
        method: 'post',
        headers: {'content-type': 'application/x-www-form-urlencoded'},
        data: qs.stringify(data)
    })
}

export function getInfo() {
    return request.request({
        url: '/user/',
        method: 'get'
    })
}
