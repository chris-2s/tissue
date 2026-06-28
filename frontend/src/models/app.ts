import {createModel} from "@rematch/core";
import type {ReactNode} from "react";
import {RootModel} from "./index";
import {themes} from "../utils/constants";

interface State {
    themeMode: string
    goodBoy: boolean
    canBack: boolean
    pin: string | null
    floatButtons: ReactNode | null
}

export const app = createModel<RootModel>()({
    state: {
        themeMode: localStorage.getItem('themeMode') || themes[0].name,
        goodBoy: localStorage.getItem('goodBoy') == '1' || false,
        canBack: false,
        pin: localStorage.getItem('pin'),
        floatButtons: null as ReactNode,
    } as State,
    reducers: {
        setThemeMode(state, payload: string) {
            localStorage.setItem('themeMode', payload)
            return {...state, themeMode: payload}
        },
        setGoodBoy(state, payload: boolean) {
            localStorage.setItem('goodBoy', payload ? '1' : '0')
            return {...state, goodBoy: payload}
        },
        setCanBack(state, payload: boolean) {
            return {...state, canBack: payload}
        },
        setPin(state, payload: string | null) {
            if (payload) {
                localStorage.setItem('pin', payload)
            } else {
                localStorage.removeItem('pin')
            }
            return {...state, pin: payload}
        },
        setFloatButtons(state, payload: ReactNode) {
            return {...state, floatButtons: payload}
        },
        clearFloatButtons(state) {
            return {...state, floatButtons: null}
        },
    },
});
