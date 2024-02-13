import {init, Models, RematchDispatch, RematchRootState} from "@rematch/core";
import {app} from "./app";
import {auth} from "./auth";


export interface RootModel extends Models<RootModel> {
    app: typeof app;
    auth: typeof auth;
}

export const models: RootModel = {app, auth};

export const store = init({models});

export type Store = typeof store
export type Dispatch = RematchDispatch<RootModel>
export type RootState = RematchRootState<RootModel>
