import {request} from "../utils/requests.ts";

export interface SiteCapabilities {
    supports_ranking: boolean;
    supports_actor: boolean;
    supports_login: boolean;
    supports_downloads: boolean;
    supports_previews: boolean;
    supports_comments: boolean;
}

export interface SiteItem {
    id: number;
    spider_key: 'javdb' | 'javbus' | 'jav321' | 'dmm';
    name: string;
    priority: number;
    alternate_host?: string;
    status?: boolean;
    cookies?: string;
    capabilities: SiteCapabilities;
}

export interface SiteUpdate {
    id: number;
    priority: number;
    alternate_host?: string;
    status?: boolean;
    cookies?: string;
}

export async function getSites(): Promise<SiteItem[]> {
    const response = await request.get('/site/');
    return response.data.data;
}

export function modifySite(site: SiteUpdate) {
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
