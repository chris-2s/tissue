import {request} from "../utils/requests.ts";

export async function getSites() {
    const response = await request.get('/site/');
    return response.data.data;
}

export function modifySite(site: any) {
    return request.put('/site/', site)
}

export function testingSits() {
    return request.post('/site/testing');
}
