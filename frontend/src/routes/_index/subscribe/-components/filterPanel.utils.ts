import type {Subscribe} from "../../../../apis/subscribe.ts";

export type SubscribeSearchTokenKind = "num" | "actor" | "title";

export interface SubscribeSearchToken {
    kind: SubscribeSearchTokenKind;
    value: string;
}

export interface SubscribeFilterValue {
    tokens: SubscribeSearchToken[];
}

function normalizeText(value: string) {
    return value.trim().toUpperCase();
}

function includesNormalized(source: string | undefined, keyword: string) {
    return normalizeText(source || "").includes(keyword);
}

export function encodeToken(token: SubscribeSearchToken) {
    return `${token.kind}:${token.value}`;
}

export function decodeToken(value: string): SubscribeSearchToken {
    const [kind, ...rest] = value.split(":");
    const tokenValue = rest.join(":").trim();

    if ((kind === "num" || kind === "actor" || kind === "title") && tokenValue) {
        return {kind, value: tokenValue};
    }

    return {kind: "title", value: value.trim()};
}

export function getTokenLabel(token: SubscribeSearchToken) {
    switch (token.kind) {
        case "num":
            return `番号: ${token.value}`;
        case "actor":
            return `演员: ${token.value}`;
        default:
            return `标题: ${token.value}`;
    }
}

export function buildAutocompleteGroups(subscribes: Subscribe[], keyword: string) {
    const normalizedKeyword = normalizeText(keyword);

    if (!normalizedKeyword) {
        return [];
    }

    const numSeen = new Set<string>();
    const actorSeen = new Set<string>();
    const numOptions: Array<{label: string; value: string}> = [];
    const actorOptions: Array<{label: string; value: string}> = [];

    for (const subscribe of subscribes) {
        const num = (subscribe.num || "").trim();
        if (num && includesNormalized(num, normalizedKeyword) && !numSeen.has(num.toUpperCase())) {
            numSeen.add(num.toUpperCase());
            numOptions.push({
                label: `番号 · ${num}`,
                value: encodeToken({kind: "num", value: num}),
            });
        }

        const actors = (subscribe.actors || "")
            .split(/[，,、/]/)
            .map((item) => item.trim())
            .filter(Boolean);

        for (const actor of actors) {
            if (includesNormalized(actor, normalizedKeyword) && !actorSeen.has(actor.toUpperCase())) {
                actorSeen.add(actor.toUpperCase());
                actorOptions.push({
                    label: `演员 · ${actor}`,
                    value: encodeToken({kind: "actor", value: actor}),
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
