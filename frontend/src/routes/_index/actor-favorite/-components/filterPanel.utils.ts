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

export interface ActorFavoriteFilterTexts {
    actorLabel: string;
    aliasLabel: string;
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

export function getTokenLabel(token: ActorFavoriteSearchToken, texts: ActorFavoriteFilterTexts) {
    switch (token.kind) {
        case "alias":
            return `${texts.aliasLabel}: ${token.value}`;
        default:
            return `${texts.actorLabel}: ${token.value}`;
    }
}

export function buildAutocompleteGroups(
    favorites: ActorFavorite[],
    keyword: string,
    texts: ActorFavoriteFilterTexts
) {
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
                label: `${texts.actorLabel} · ${name}`,
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
                    label: `${texts.aliasLabel} · ${alias}`,
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
        groups.push({label: texts.actorLabel, options: nameOptions});
    }
    if (aliasOptions.length > 0) {
        groups.push({label: texts.aliasLabel, options: aliasOptions});
    }
    return groups;
}
