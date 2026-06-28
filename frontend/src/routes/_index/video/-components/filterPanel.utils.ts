import type {VideoDetail} from "../../../../types/video";

const AUTOCOMPLETE_OPTION_LIMIT = 8;

export type VideoSearchTokenKind = "num" | "actor" | "title";
export type VideoFlagFilter = "include" | "exclude" | null;
export type VideoRatingOperator = "gte" | "lte";

export interface VideoSearchToken {
    kind: VideoSearchTokenKind;
    value: string;
}

export interface VideoFilterValue {
    tokens: VideoSearchToken[];
    zh: VideoFlagFilter;
    uncensored: VideoFlagFilter;
    ratingOperator: VideoRatingOperator;
    ratingValue: number | null;
}

export interface VideoFilterTexts {
    numLabel: string;
    actorLabel: string;
    titleLabel: string;
    zhLabel: string;
    uncensoredLabel: string;
    includePrefix: string;
    excludePrefix: string;
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

export function getTokenLabel(token: VideoSearchToken, texts: VideoFilterTexts) {
    switch (token.kind) {
        case "num":
            return `${texts.numLabel}: ${token.value}`;
        case "actor":
            return `${texts.actorLabel}: ${token.value}`;
        default:
            return `${texts.titleLabel}: ${token.value}`;
    }
}

function normalizeText(value: string) {
    return value.trim().toUpperCase();
}

function includesNormalized(source: string | undefined, keyword: string) {
    return normalizeText(source || "").includes(keyword);
}

export function buildAutocompleteGroups(videos: VideoDetail[], keyword: string, texts: VideoFilterTexts) {
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
        if (
            numOptions.length < AUTOCOMPLETE_OPTION_LIMIT &&
            num &&
            includesNormalized(num, normalizedKeyword) &&
            !numSeen.has(num.toUpperCase())
        ) {
            numSeen.add(num.toUpperCase());
            numOptions.push({
                label: `${texts.numLabel} · ${num}`,
                value: encodeToken({kind: "num", value: num}),
            });
        }

        for (const actor of video.actors) {
            const name = (actor.name || "").trim();
            if (actorOptions.length >= AUTOCOMPLETE_OPTION_LIMIT) {
                break;
            }

            if (name && includesNormalized(name, normalizedKeyword) && !actorSeen.has(name.toUpperCase())) {
                actorSeen.add(name.toUpperCase());
                actorOptions.push({
                    label: `${texts.actorLabel} · ${name}`,
                    value: encodeToken({kind: "actor", value: name}),
                });
            }
        }

        if (
            numOptions.length >= AUTOCOMPLETE_OPTION_LIMIT &&
            actorOptions.length >= AUTOCOMPLETE_OPTION_LIMIT
        ) {
            break;
        }
    }

    const groups = [];
    if (numOptions.length > 0) {
        groups.push({label: texts.numLabel, options: numOptions});
    }
    if (actorOptions.length > 0) {
        groups.push({label: texts.actorLabel, options: actorOptions});
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

export function cycleFlagFilter(value: VideoFlagFilter): VideoFlagFilter {
    if (value === null) {
        return "include";
    }
    if (value === "include") {
        return "exclude";
    }
    return null;
}

export function getFlagFilterLabel(name: string, value: VideoFlagFilter, texts: Pick<VideoFilterTexts, 'includePrefix' | 'excludePrefix'>) {
    if (value === "include") {
        return `${texts.includePrefix}${name}`;
    }
    if (value === "exclude") {
        return `${texts.excludePrefix}${name}`;
    }
    return name;
}
