import {request} from "../utils/requests";
import type {ActorFavorite, ActorFavoriteCreate, ActorPageData} from "../types/actor.ts";
import type {SourceRef} from "../types/video.ts";

export interface ActorSearchItem {
    code?: string;
    name?: string;
    thumb?: string;
    alias?: string[];
    source: SourceRef;
}

export interface GetActorPageParams {
    site_id: number;
    code: string;
    page?: number;
}

export async function searchActors(name: string): Promise<ActorSearchItem[]> {
    const response = await request.request({
        url: '/actor/search',
        method: 'get',
        params: {name}
    });
    return response.data.data || [];
}

export async function getActorPage(params: GetActorPageParams): Promise<ActorPageData> {
    const response = await request.request({
        url: '/actor/page',
        method: 'get',
        params
    });
    return response.data.data;
}

export async function getActorFavorites(): Promise<ActorFavorite[]> {
    const response = await request.request({
        url: '/actor/favorite',
        method: 'get'
    });
    return response.data.data || [];
}

export async function createActorFavorite(data: ActorFavoriteCreate): Promise<ActorFavorite> {
    const response = await request.request({
        url: '/actor/favorite',
        method: 'post',
        data
    });
    return response.data.data;
}

export function deleteActorFavorite(id: number) {
    return request.request({
        url: '/actor/favorite',
        method: 'delete',
        params: {favorite_id: id},
    });
}
