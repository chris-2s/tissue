import React from 'react';
import ReactDOM from 'react-dom/client';
import {Provider, useSelector} from "react-redux";
import {QueryClientProvider} from "@tanstack/react-query";
import {RouterProvider} from "@tanstack/react-router";

import {RootState, store} from "./models";
import {queryClient} from "./queryClient.ts";

import './index.css';
import {router} from "./routes.tsx";

function InnerApp() {
    const {userToken} = useSelector((state: RootState) => state.auth)
    return <RouterProvider router={router} context={{userToken, queryClient}}/>
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <Provider store={store}>
            <QueryClientProvider client={queryClient}>
                <InnerApp/>
            </QueryClientProvider>
        </Provider>
    </React.StrictMode>
)
