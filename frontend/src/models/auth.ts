import {createModel} from "@rematch/core";
import {RootModel} from "./index";
import Cookies from 'js-cookie';
import * as api from "../apis/auth";
import {compare} from "compare-versions";
import {router} from "../routes.tsx";


interface State {
    userToken: string | undefined
    userInfo: any | undefined
    logging: boolean
    versions?: { current: string, latest: string, hasNew: boolean },
}

export const auth = createModel<RootModel>()({
    state: {
        userToken: Cookies.get("userToken"),
        userInfo: undefined,
        logging: false,
        version: undefined,
    } as State,
    reducers: {
        setLogging(state, payload: boolean) {
            return {...state, logging: payload}
        },
        setToken(state, payload: string | undefined) {
            return {...state, userToken: payload}
        },
        setInfo(state, payload: any | undefined) {
            return {...state, userInfo: payload}
        },
        setVersions(state, payload: any | undefined) {
            return {...state, versions: payload}
        },
    },
    effects: (dispatch) => ({
        async login(params: { username: string, password: string, remember: boolean }) {
            try {
                dispatch.auth.setLogging(true)
                const response = await api.login(params)
                const token = response.data.data
                Cookies.set('userToken', token, params.remember ? {expires: 365} : {})
                dispatch.auth.setToken(token)
                await router.invalidate()
            } finally {
                dispatch.auth.setLogging(false)
            }
        },
        async logout() {
            Cookies.remove("userToken")
            localStorage.removeItem("pin")
            dispatch.auth.setToken(undefined)
            await router.invalidate()
        },
        async getInfo() {
            const response = await api.getInfo()
            dispatch.auth.setInfo(response.data.data)
        },
        async getVersions() {
            const response = await api.getVersions()
            const versions = response.data.data
            versions.hasNew = compare(versions.latest, versions.current, '>')
            dispatch.auth.setVersions(versions)
        }
    })
});
