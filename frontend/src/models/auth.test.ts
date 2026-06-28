import {afterEach, describe, expect, it, vi} from "vitest";

describe("auth model effects", () => {
    afterEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
        vi.unstubAllGlobals();
    });

    it("login stores token, updates state and navigates", async () => {
        const setLogging = vi.fn();
        const setToken = vi.fn();
        const navigate = vi.fn().mockResolvedValue(undefined);
        const cookieSet = vi.fn();

        vi.doMock("js-cookie", () => ({
            default: {
                get: vi.fn(),
                set: cookieSet,
                remove: vi.fn(),
            },
        }));
        vi.doMock("../apis/auth", () => ({
            login: vi.fn().mockResolvedValue({data: {data: "jwt-token"}}),
            getInfo: vi.fn(),
            getVersions: vi.fn(),
        }));
        vi.doMock("../apis/video.ts", () => ({
            getVideos: vi.fn(),
        }));
        vi.doMock("../routes.tsx", () => ({
            router: {navigate},
        }));

        const {auth} = await import("./auth.ts");
        const effects = auth.effects!({
            auth: {setLogging, setToken, setInfo: vi.fn(), setVersions: vi.fn(), setVideos: vi.fn()},
            app: {setPin: vi.fn()},
        } as never) as any;

        await effects.login({username: "admin", password: "password", remember: true});

        expect(setLogging).toHaveBeenNthCalledWith(1, true);
        expect(cookieSet).toHaveBeenCalledWith("userToken", "jwt-token", {expires: 365, sameSite: "Lax"});
        expect(setToken).toHaveBeenCalledWith("jwt-token");
        expect(navigate).toHaveBeenCalledWith({to: "/"});
        expect(setLogging).toHaveBeenLastCalledWith(false);
    });

    it("logout clears cookie, pin and token, then navigates to login", async () => {
        const setPin = vi.fn();
        const setToken = vi.fn();
        const navigate = vi.fn().mockResolvedValue(undefined);
        const cookieRemove = vi.fn();

        vi.doMock("js-cookie", () => ({
            default: {
                get: vi.fn(),
                set: vi.fn(),
                remove: cookieRemove,
            },
        }));
        vi.doMock("../apis/auth", () => ({
            login: vi.fn(),
            getInfo: vi.fn(),
            getVersions: vi.fn(),
        }));
        vi.doMock("../apis/video.ts", () => ({
            getVideos: vi.fn(),
        }));
        vi.doMock("../routes.tsx", () => ({
            router: {navigate},
        }));

        const {auth} = await import("./auth.ts");
        const effects = auth.effects!({
            auth: {setLogging: vi.fn(), setToken, setInfo: vi.fn(), setVersions: vi.fn(), setVideos: vi.fn()},
            app: {setPin},
        } as never) as any;

        await effects.logout();

        expect(cookieRemove).toHaveBeenCalledWith("userToken");
        expect(setPin).toHaveBeenCalledWith("");
        expect(setToken).toHaveBeenCalledWith(undefined);
        expect(navigate).toHaveBeenCalledWith({to: "/login"});
    });

    it("get_versions computes hasNew before storing versions", async () => {
        const setVersions = vi.fn();

        vi.doMock("js-cookie", () => ({
            default: {
                get: vi.fn(),
                set: vi.fn(),
                remove: vi.fn(),
            },
        }));
        vi.doMock("../apis/auth", () => ({
            login: vi.fn(),
            getInfo: vi.fn(),
            getVersions: vi.fn().mockResolvedValue({
                data: {
                    data: {
                        current: "1.0.0",
                        latest: "1.1.0",
                    },
                },
            }),
        }));
        vi.doMock("../apis/video.ts", () => ({
            getVideos: vi.fn(),
        }));
        vi.doMock("../routes.tsx", () => ({
            router: {navigate: vi.fn()},
        }));

        const {auth} = await import("./auth.ts");
        const effects = auth.effects!({
            auth: {
                setLogging: vi.fn(),
                setToken: vi.fn(),
                setInfo: vi.fn(),
                setVersions,
                setVideos: vi.fn(),
            },
            app: {setPin: vi.fn()},
        } as never) as any;

        await effects.getVersions();

        expect(setVersions).toHaveBeenCalledWith({
            current: "1.0.0",
            latest: "1.1.0",
            hasNew: true,
        });
    });
});
