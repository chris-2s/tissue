import {createModel} from "@rematch/core";
import {RootModel} from "./index";
import Cookies from 'js-cookie';
import * as api from "../apis/auth";


interface State {
    userToken: string | undefined
    userInfo: any | undefined
    logging: boolean
}

export const auth = createModel<RootModel>()({
    state: {
        userToken: Cookies.get("userToken"),
        userInfo: undefined,
        logging: false,
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
        }
    },
    effects: (dispatch) => ({
        async login(params: { username: string, password: string }) {
            try {
                dispatch.auth.setLogging(true)
                const response = await api.login(params)
                const token = response.data.data
                Cookies.set('userToken', token)
                dispatch.auth.setToken(token)
            } finally {
                dispatch.auth.setLogging(false)
            }
        },
        async logout() {
            Cookies.remove("userToken")
            dispatch.auth.setToken(undefined)
        },
        async getInfo() {
            const response = await api.getInfo()
            dispatch.auth.setInfo(response.data.data)
        }
    })
});
