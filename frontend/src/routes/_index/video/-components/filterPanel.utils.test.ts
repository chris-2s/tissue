import {describe, expect, it} from "vitest";
import {
    buildAutocompleteGroups,
    cycleFlagFilter,
    decodeToken,
    encodeToken,
    formatRating,
    getFlagFilterLabel,
    getTokenLabel,
    getVideoRatingValue,
} from "./filterPanel.utils.ts";

describe("filter panel utils", () => {
    const texts = {
        numLabel: "番号",
        actorLabel: "演员",
        titleLabel: "标题",
        zhLabel: "中文",
        uncensoredLabel: "无码",
        includePrefix: "仅",
        excludePrefix: "非",
    } as const;

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
        expect(getTokenLabel({kind: "num", value: "IPX-001"}, texts)).toBe("番号: IPX-001");
    });

    it("builds grouped autocomplete options", () => {
        const groups = buildAutocompleteGroups(videos, "三", texts);

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

    it("cycles tri-state flag filters and formats labels", () => {
        expect(cycleFlagFilter(null)).toBe("include");
        expect(cycleFlagFilter("include")).toBe("exclude");
        expect(cycleFlagFilter("exclude")).toBe(null);
        expect(getFlagFilterLabel("中文", null, texts)).toBe("中文");
        expect(getFlagFilterLabel("中文", "include", texts)).toBe("仅中文");
        expect(getFlagFilterLabel("中文", "exclude", texts)).toBe("非中文");
    });
});
