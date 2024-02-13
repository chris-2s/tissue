import {request} from "../utils/requests";

export function getStatistics() {
    return request.request({
        url: '/home/statistic',
        method: 'get'
    })
}

export function getSchedules() {
    return request.request({
        url: '/home/schedule',
        method: 'get'
    })
}
