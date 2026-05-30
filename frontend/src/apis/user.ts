import {request} from "../utils/requests";

export interface ApiKeyItem {
    id: number
    user_id: number
    name: string
    key: string
    enabled: boolean
    create_time?: string | null
}

export interface ApiKeyCreatePayload {
    name: string
}

export interface ApiKeyUpdatePayload {
    name?: string
    enabled?: boolean
}

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

export async function listApiKeys(): Promise<ApiKeyItem[]> {
    const response = await request.request({
        url: '/user/api-keys',
        method: 'get',
    })
    return response.data.data || []
}

export async function createApiKey(data: ApiKeyCreatePayload): Promise<ApiKeyItem> {
    const response = await request.request({
        url: '/user/api-keys',
        method: 'post',
        data,
    })
    return response.data.data
}

export function updateApiKey(id: number, data: ApiKeyUpdatePayload) {
    return request.request({
        url: `/user/api-keys/${id}`,
        method: 'patch',
        data,
    })
}

export function deleteApiKey(id: number) {
    return request.request({
        url: `/user/api-keys/${id}`,
        method: 'delete',
    })
}
