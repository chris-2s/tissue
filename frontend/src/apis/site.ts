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

export function getLoginPage(siteId: number) {
    return request.get(`/site/${siteId}/login/page`);
}

export function submitLogin(siteId: number, data: {
    cookies: string;
    authenticity_token: string;
    username: string;
    password: string;
    captcha: string;
}) {
    return request.post(`/site/${siteId}/login/submit`, data);
}
