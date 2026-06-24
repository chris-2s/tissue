import {describe, expect, it} from "vitest";
import {
    buildAutocompleteGroups,
    decodeToken,
    encodeToken,
    formatRating,
    getTokenLabel,
    getVideoRatingValue,
} from "./filterPanel.utils.ts";

describe("filter panel utils", () => {
    const videos = [
        {
            title: "教师特别课",
            num: "IPX-001",
            rating: "4.30",
            is_zh: true,
            is_uncensored: false,
            actors: [{name: "三上悠亚"}],
        },
        {
            title: "夏日海边",
            num: "SSIS-123",
            rating: "3.70",
            is_zh: false,
            is_uncensored: true,
            actors: [{name: "河北彩花"}],
        },
    ] as any;

    it("encodes and decodes tokens", () => {
        const value = encodeToken({kind: "actor", value: "三上悠亚"});

        expect(value).toBe("actor:三上悠亚");
        expect(decodeToken(value)).toEqual({kind: "actor", value: "三上悠亚"});
        expect(getTokenLabel({kind: "num", value: "IPX-001"})).toBe("番号: IPX-001");
    });

    it("builds grouped autocomplete options", () => {
        const groups = buildAutocompleteGroups(videos, "三");

        expect(groups).toHaveLength(1);
        expect(groups[0]).toMatchObject({
            label: "演员",
            options: [{label: "演员 · 三上悠亚", value: "actor:三上悠亚"}],
        });
    });

    it("keeps rating precision for display", () => {
        expect(getVideoRatingValue(videos[0])).toBe(4.3);
        expect(formatRating(4.3)).toBe("4.30");
    });
});
