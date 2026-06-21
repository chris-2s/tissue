import {afterEach, describe, expect, it, vi} from "vitest";

describe("requests interceptors", () => {
    afterEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
        vi.unstubAllGlobals();
    });

    it("injects authorization header when token exists", async () => {
        vi.stubGlobal("document", {
            location: {origin: "http://localhost:3000"},
        });
        vi.doMock("../models", () => ({
            store: {
                getState: () => ({auth: {userToken: "token-123"}}),
                dispatch: {auth: {logout: vi.fn()}},
            },
        }));
        vi.doMock("../configs", () => ({
            default: {BASE_API: "http://localhost:3000/api"},
        }));
        vi.doMock("antd", () => ({
            message: {error: vi.fn()},
        }));

        const {request} = await import("./requests.ts");
        const handler = (request.interceptors.request.handlers as any)[0].fulfilled;

        const config = await handler({headers: {}} as never);

        expect(config.headers["Authorization"]).toBe("Bearer token-123");
    });

    it("logs out on 401 responses", async () => {
        vi.stubGlobal("document", {
            location: {origin: "http://localhost:3000"},
        });
        const logout = vi.fn();
        const errorMessage = vi.fn();

        vi.doMock("../models", () => ({
            store: {
                getState: () => ({auth: {userToken: undefined}}),
                dispatch: {auth: {logout}},
            },
        }));
        vi.doMock("../configs", () => ({
            default: {BASE_API: "http://localhost:3000/api"},
        }));
        vi.doMock("antd", () => ({
            message: {error: errorMessage},
        }));

        const {request} = await import("./requests.ts");
        const rejected = (request.interceptors.response.handlers as any)[0].rejected;

        await expect(rejected({
            response: {
                status: 401,
                data: "unauthorized",
            },
        })).rejects.toMatchObject({
            response: {status: 401},
        });

        expect(logout).toHaveBeenCalledTimes(1);
        expect(errorMessage).not.toHaveBeenCalled();
    });

    it("shows backend error messages for non-401 failures", async () => {
        vi.stubGlobal("document", {
            location: {origin: "http://localhost:3000"},
        });
        const logout = vi.fn();
        const errorMessage = vi.fn();

        vi.doMock("../models", () => ({
            store: {
                getState: () => ({auth: {userToken: undefined}}),
                dispatch: {auth: {logout}},
            },
        }));
        vi.doMock("../configs", () => ({
            default: {BASE_API: "http://localhost:3000/api"},
        }));
        vi.doMock("antd", () => ({
            message: {error: errorMessage},
        }));

        const {request} = await import("./requests.ts");
        const rejected = (request.interceptors.response.handlers as any)[0].rejected;

        await expect(rejected({
            response: {
                status: 500,
                data: "server error",
            },
        })).rejects.toMatchObject({
            response: {status: 500},
        });

        expect(logout).not.toHaveBeenCalled();
        expect(errorMessage).toHaveBeenCalledWith("server error");
    });
});
