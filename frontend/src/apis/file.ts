import {request} from "../utils/requests";

export async function getFiles() {
    const response = await request.request({
        url: '/file/',
    })
    return response.data.data
}
