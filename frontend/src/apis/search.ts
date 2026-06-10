import {request} from "../utils/requests";
import type {SourceRef} from "../types/video";

export interface ActorSearchItem {
    code?: string;
    name?: string;
    thumb?: string;
    alias?: string[];
    source: SourceRef;
}

export async function searchActors(name: string): Promise<ActorSearchItem[]> {
    const response = await request.request({
        url: '/actor/search',
        method: 'get',
        params: {name}
    });
    return response.data.data || [];
}
