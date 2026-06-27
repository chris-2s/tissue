import type {ActorFavorite} from "../../../../types/actor.ts";

const AUTOCOMPLETE_OPTION_LIMIT = 8;

export type ActorFavoriteSearchTokenKind = "name" | "alias";

export interface ActorFavoriteSearchToken {
    kind: ActorFavoriteSearchTokenKind;
    value: string;
}

export interface ActorFavoriteFilterValue {
    tokens: ActorFavoriteSearchToken[];
}

function normalizeText(value: string) {
    return value.trim().toUpperCase();
}

function includesNormalized(source: string | undefined, keyword: string) {
    return normalizeText(source || "").includes(keyword);
}

export function encodeToken(token: ActorFavoriteSearchToken) {
    return `${token.kind}:${token.value}`;
}

export function decodeToken(value: string): ActorFavoriteSearchToken {
    const [kind, ...rest] = value.split(":");
    const tokenValue = rest.join(":").trim();

    if ((kind === "name" || kind === "alias") && tokenValue) {
        return {kind, value: tokenValue};
    }

    return {kind: "name", value: value.trim()};
}

export function getTokenLabel(token: ActorFavoriteSearchToken) {
    switch (token.kind) {
        case "alias":
            return `别名: ${token.value}`;
        default:
            return `演员: ${token.value}`;
    }
}

export function buildAutocompleteGroups(favorites: ActorFavorite[], keyword: string) {
    const normalizedKeyword = normalizeText(keyword);

    if (!normalizedKeyword) {
        return [];
    }

    const nameSeen = new Set<string>();
    const aliasSeen = new Set<string>();
    const nameOptions: Array<{label: string; value: string}> = [];
    const aliasOptions: Array<{label: string; value: string}> = [];

    for (const favorite of favorites) {
        const name = (favorite.actor.name || favorite.actor_code || "").trim();
        if (
            nameOptions.length < AUTOCOMPLETE_OPTION_LIMIT &&
            name &&
            includesNormalized(name, normalizedKeyword) &&
            !nameSeen.has(name.toUpperCase())
        ) {
            nameSeen.add(name.toUpperCase());
            nameOptions.push({
                label: `演员 · ${name}`,
                value: encodeToken({kind: "name", value: name}),
            });
        }

        for (const alias of favorite.actor.alias.filter(Boolean)) {
            if (aliasOptions.length >= AUTOCOMPLETE_OPTION_LIMIT) {
                break;
            }

            if (includesNormalized(alias, normalizedKeyword) && !aliasSeen.has(alias.toUpperCase())) {
                aliasSeen.add(alias.toUpperCase());
                aliasOptions.push({
                    label: `别名 · ${alias}`,
                    value: encodeToken({kind: "alias", value: alias}),
                });
            }
        }

        if (
            nameOptions.length >= AUTOCOMPLETE_OPTION_LIMIT &&
            aliasOptions.length >= AUTOCOMPLETE_OPTION_LIMIT
        ) {
            break;
        }
    }

    const groups = [];
    if (nameOptions.length > 0) {
        groups.push({label: "演员", options: nameOptions});
    }
    if (aliasOptions.length > 0) {
        groups.push({label: "别名", options: aliasOptions});
    }
    return groups;
}
