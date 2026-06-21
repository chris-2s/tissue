import {describe, expect, it} from "vitest";

import {aggregateVideos, groupActors, normalizeSearch} from "./-search.utils.ts";

describe("search utils", () => {
    it("normalizes empty mode to video and trims keyword", () => {
        expect(normalizeSearch({keyword: " MIDV-639 "})).toEqual({
            mode: "video",
            keyword: "MIDV-639",
        });
    });

    it("groups actors by site id", () => {
        expect(groupActors([
            {
                name: "Actor A",
                code: "a",
                source: {site_id: 1, site_name: "JavDB", spider_key: "javdb"},
            },
            {
                name: "Actor B",
                code: "b",
                source: {site_id: 1, site_name: "JavDB", spider_key: "javdb"},
            },
        ])).toEqual([
            {
                siteId: 1,
                siteName: "JavDB",
                videoItems: [],
                actorItems: [
                    {name: "Actor A", code: "a", thumb: undefined, site_id: 1, site_name: "JavDB"},
                    {name: "Actor B", code: "b", thumb: undefined, site_id: 1, site_name: "JavDB"},
                ],
            },
        ]);
    });

    it("aggregates duplicate videos and merges site names", () => {
        const videos = aggregateVideos([
            {
                num: "midv-639",
                title: "Title",
                isZh: false,
                rank: 0,
                rank_count: 0,
                source: {site_id: 1, site_name: "JavDB", spider_key: "javdb"},
            },
            {
                num: "MIDV-639",
                title: "Title",
                isZh: true,
                rank: 9.5,
                rank_count: 12,
                source: {site_id: 2, site_name: "JavBus", spider_key: "javbus"},
            },
        ]);

        expect(videos).toHaveLength(1);
        expect(videos[0]).toMatchObject({
            num: "midv-639",
            isZh: true,
            rank: 9.5,
            rank_count: 12,
            site_names: ["JavDB", "JavBus"],
        });
    });
});
