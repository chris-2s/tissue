import {createModel} from "@rematch/core";
import {RootModel} from "./index";
import Cookies from 'js-cookie';
import {themes} from "../utils/constants";


export const app = createModel<RootModel>()({
    state: {
        theme: Cookies.get('theme') || themes[0].name,
        goodBoy: Cookies.get('goodBoy') == '1' || false
    },
    reducers: {
        setTheme(state, payload: string) {
            Cookies.set('theme', payload, {expires: 365})
            return {...state, theme: payload}
        },
        setGoodBoy(state, payload: boolean) {
            Cookies.set('goodBoy', payload ? '1' : '0', {expires: 365})
            return {...state, goodBoy: payload}
        },
    },
});
