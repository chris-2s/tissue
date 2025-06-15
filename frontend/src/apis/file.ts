import {request} from "../utils/requests";

export async function getFiles() {
    const response = await request.request({
        url: '/file/',
    })
    return response.data.data
}

export async function batchParseFiles(files: string[]) {

    const params = files.map((file) => `paths=${encodeURIComponent(file)}`).join('&')

    return request.request({
        url: '/video/batch/parse?' + params,
        method: 'get'
    })
}
