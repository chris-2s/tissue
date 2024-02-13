import {createModel} from "@rematch/core";
import {RootModel} from "./index";
import Cookies from 'js-cookie';
import {themes} from "../utils/constants";


export const app = createModel<RootModel>()({
    state: {
        theme: Cookies.get('theme') || themes[0].name,
    },
    reducers: {
        setTheme(state, payload: string) {
            Cookies.set('theme', payload)
            return {...state, theme: payload}
        },
    },
});
