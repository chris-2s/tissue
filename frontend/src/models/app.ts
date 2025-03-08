import {createModel} from "@rematch/core";
import {RootModel} from "./index";
import Cookies from 'js-cookie';
import {themes} from "../utils/constants";


export const app = createModel<RootModel>()({
    state: {
        themeMode: Cookies.get('themeMode') || themes[0].name,
        goodBoy: Cookies.get('goodBoy') == '1' || false,
        canBack: false
    },
    reducers: {
        setThemeMode(state, payload: string) {
            Cookies.set('themeMode', payload, {expires: 365})
            return {...state, themeMode: payload}
        },
        setGoodBoy(state, payload: boolean) {
            Cookies.set('goodBoy', payload ? '1' : '0', {expires: 365})
            return {...state, goodBoy: payload}
        },
        setCanBack(state, payload: boolean) {
            return {...state, canBack: payload}
        },
    },
});
