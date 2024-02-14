import {request} from "../utils/requests";

export async function getSchedules() {
    const response = await request.request({
        url: '/schedule/',
        method: 'get'
    })
    return response.data.data
}

export function fireSchedule(key: string) {
    return request.request({
        url: '/schedule/fire',
        method: 'get',
        params: {key: key}
    })
}
