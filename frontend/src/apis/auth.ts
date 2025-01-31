import {request} from "../utils/requests";

export function login(data: any) {
    return request.request({
        url: '/auth/login',
        method: 'post',
        headers: {'content-type': 'application/x-www-form-urlencoded'},
        data: `username=${data.username}&password=${data.password}`
    })
}

export function getInfo() {
    return request.request({
        url: '/user/',
        method: 'get'
    })
}

export function getVersions() {
    return request.request({
        url: '/common/version',
        method: 'get'
    })
}
