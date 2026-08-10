import {request} from "../utils/requests";

export function login(data: any) {
    const payload = new URLSearchParams({
        username: data.username,
        password: data.password,
        remember: String(Boolean(data.remember)),
    });

    return request.request({
        url: '/auth/login',
        method: 'post',
        headers: {'content-type': 'application/x-www-form-urlencoded'},
        data: payload.toString(),
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

export async function getLogStreamToken(): Promise<string> {
    const response = await request.request({
        url: '/auth/log-token',
        method: 'post',
    })
    return response.data.data
}
