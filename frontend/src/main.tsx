import React from 'react';
import ReactDOM from 'react-dom/client';
import {Provider, useSelector} from "react-redux";
import {RouterProvider} from "@tanstack/react-router";

import {RootState, store} from "./models";

import './index.css';
import {router} from "./routes.tsx";

function InnerApp() {
    const {userToken} = useSelector((state: RootState) => state.auth)
    return <RouterProvider router={router} context={{userToken}}/>
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <Provider store={store}>
            <InnerApp/>
        </Provider>
    </React.StrictMode>
)
