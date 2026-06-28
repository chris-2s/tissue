import {describe, expect, it} from "vitest";
import {
    buildAutocompleteGroups,
    decodeToken,
    encodeToken,
    getTokenLabel,
} from "./filterPanel.utils.ts";

describe("subscribe filter panel utils", () => {
    const texts = {
        numLabel: "番号",
        actorLabel: "演员",
        titleLabel: "标题",
    } as const;

    const subscribes = [
        {
            id: 1,
            num: "IPX-001",
            title: "教师特别课",
            actors: "三上悠亚, 河北彩花",
        },
        {
            id: 2,
            num: "SSIS-123",
            title: "夏日海边",
            actors: "天使萌",
        },
    ] as any;

    it("encodes and decodes tokens", () => {
        const value = encodeToken({kind: "actor", value: "三上悠亚"});

        expect(value).toBe("actor:三上悠亚");
        expect(decodeToken(value)).toEqual({kind: "actor", value: "三上悠亚"});
        expect(getTokenLabel({kind: "num", value: "IPX-001"}, texts)).toBe("番号: IPX-001");
    });

    it("builds grouped autocomplete options", () => {
        const groups = buildAutocompleteGroups(subscribes, "三", texts);

        expect(groups).toHaveLength(1);
        expect(groups[0]).toMatchObject({
            label: "演员",
            options: [{label: "演员 · 三上悠亚", value: "actor:三上悠亚"}],
        });
    });
});
