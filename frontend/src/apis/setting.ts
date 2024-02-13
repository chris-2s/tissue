import {request} from "../utils/requests";

export async function getSettings() {
    const response = await request.request({
        url: '/setting/',
    })
    return response.data.data
}

export function saveSetting(section: string, data: any) {
    return request.request({
        url: '/setting/',
        method: 'post',
        params:{section},
        data: data
    })
}
