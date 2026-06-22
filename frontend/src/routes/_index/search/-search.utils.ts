import type * as actorApi from "../../../apis/actor.ts";
import type * as searchApi from "../../../apis/search.ts";
import type {
    SearchMode,
    SearchResultGroup,
    SearchRouteSearch,
    VideoCandidate,
} from "./-components/types.ts";

export function normalizeSearch(search: SearchRouteSearch): { mode: SearchMode; keyword: string } {
    return {
        mode: search.mode === 'actor' ? 'actor' : 'video',
        keyword: (search.keyword || '').trim()
    };
}

export function groupActors(actors: actorApi.ActorSearchItem[]): SearchResultGroup[] {
    const groupMap = new Map<number, SearchResultGroup>();

    for (const actor of actors) {
        const source = actor.source;
        if (!source?.site_id) {
            continue;
        }

        const group = groupMap.get(source.site_id) || {
            siteId: source.site_id,
            siteName: source.site_name,
            videoItems: [],
            actorItems: [],
        };

        group.actorItems.push({
            name: actor.name || '',
            code: actor.code || '',
            thumb: actor.thumb,
            site_id: source.site_id,
            site_name: source.site_name,
        });

        groupMap.set(source.site_id, group);
    }

    return Array.from(groupMap.values());
}

export function aggregateVideos(videos: searchApi.VideoSearchItem[]): VideoCandidate[] {
    const videoMap = new Map<string, VideoCandidate>();

    for (const video of videos) {
        const num = (video.num || '').trim();
        if (!num) {
            continue;
        }

        const key = num.toUpperCase();
        const existing = videoMap.get(key);
        if (existing) {
            if (video.isZh) {
                existing.isZh = true;
            }
            if (!existing.rank && video.rank) {
                existing.rank = video.rank;
            }
            if (!existing.rank_count && video.rank_count) {
                existing.rank_count = video.rank_count;
            }
            if (video.source?.site_name && !existing.site_names.includes(video.source.site_name)) {
                existing.site_names.push(video.source.site_name);
            }
            continue;
        }

        videoMap.set(key, {
            num,
            title: video.title || '',
            publish_date: video.publish_date || '',
            rank: video.rank || 0,
            rank_count: video.rank_count || 0,
            isZh: !!video.isZh,
            cover: video.cover,
            url: video.url || '',
            site_id: video.source?.site_id || 0,
            site_name: video.source?.site_name,
            site_names: video.source?.site_name ? [video.source.site_name] : [],
        });
    }

    return Array.from(videoMap.values());
}
