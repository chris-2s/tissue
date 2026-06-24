import type {VideoDetail} from "../../../../types/video";

export type VideoSearchTokenKind = "num" | "actor" | "title";

export interface VideoSearchToken {
    kind: VideoSearchTokenKind;
    value: string;
}

export interface VideoFilterValue {
    tokens: VideoSearchToken[];
    isZh: boolean;
    isUncensored: boolean;
    minRating: number | null;
}

export function encodeToken(token: VideoSearchToken) {
    return `${token.kind}:${token.value}`;
}

export function decodeToken(value: string): VideoSearchToken {
    const [kind, ...rest] = value.split(":");
    const tokenValue = rest.join(":").trim();

    if ((kind === "num" || kind === "actor" || kind === "title") && tokenValue) {
        return {kind, value: tokenValue};
    }

    return {kind: "title", value: value.trim()};
}

export function getTokenLabel(token: VideoSearchToken) {
    switch (token.kind) {
        case "num":
            return `番号: ${token.value}`;
        case "actor":
            return `演员: ${token.value}`;
        default:
            return `标题: ${token.value}`;
    }
}

function normalizeText(value: string) {
    return value.trim().toUpperCase();
}

function includesNormalized(source: string | undefined, keyword: string) {
    return normalizeText(source || "").includes(keyword);
}

export function buildAutocompleteGroups(videos: VideoDetail[], keyword: string) {
    const normalizedKeyword = normalizeText(keyword);

    if (!normalizedKeyword) {
        return [];
    }

    const numSeen = new Set<string>();
    const actorSeen = new Set<string>();
    const numOptions: Array<{label: string; value: string}> = [];
    const actorOptions: Array<{label: string; value: string}> = [];

    for (const video of videos) {
        const num = (video.num || "").trim();
        if (num && includesNormalized(num, normalizedKeyword) && !numSeen.has(num.toUpperCase())) {
            numSeen.add(num.toUpperCase());
            numOptions.push({
                label: `番号 · ${num}`,
                value: encodeToken({kind: "num", value: num}),
            });
        }

        for (const actor of video.actors) {
            const name = (actor.name || "").trim();
            if (name && includesNormalized(name, normalizedKeyword) && !actorSeen.has(name.toUpperCase())) {
                actorSeen.add(name.toUpperCase());
                actorOptions.push({
                    label: `演员 · ${name}`,
                    value: encodeToken({kind: "actor", value: name}),
                });
            }
        }
    }

    const groups = [];
    if (numOptions.length > 0) {
        groups.push({label: "番号", options: numOptions.slice(0, 8)});
    }
    if (actorOptions.length > 0) {
        groups.push({label: "演员", options: actorOptions.slice(0, 8)});
    }
    return groups;
}

export function getVideoRatingValue(video: VideoDetail) {
    const parsed = Number(video.rating);
    return Number.isFinite(parsed) ? parsed : undefined;
}

export function formatRating(value: number) {
    return value.toFixed(2);
}
