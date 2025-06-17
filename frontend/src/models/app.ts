import {createModel} from "@rematch/core";
import {RootModel} from "./index";
import {themes} from "../utils/constants";


export const app = createModel<RootModel>()({
    state: {
        themeMode: localStorage.getItem('themeMode') || themes[0].name,
        goodBoy: localStorage.getItem('goodBoy') == '1' || false,
        canBack: false,
        pin: localStorage.getItem('pin'),
    },
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
    },
});
