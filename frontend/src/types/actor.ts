import type {PagedResponse, SiteVideo, SourceRef} from "./video.ts";

export interface Actor {
    code?: string;
    name?: string;
    thumb?: string;
    alias: string[];
    source: SourceRef;
}

export interface ActorPageData {
    actor: Actor;
    page: PagedResponse<SiteVideo[]>;
    is_favorite: boolean;
}

export interface ActorFavoriteCreate {
    site_id: number;
    actor_code: string;
    actor_name?: string;
    actor_thumb?: string;
    actor_alias: string[];
}

export interface ActorFavorite extends ActorFavoriteCreate {
    id: number;
    actor: Actor;
}
