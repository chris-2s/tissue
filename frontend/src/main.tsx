import React from 'react';
import ReactDOM from 'react-dom/client';
import {Provider} from "react-redux";
import {QueryClientProvider} from "@tanstack/react-query";
import {I18nextProvider} from "react-i18next";

import App from "./App";
import i18n from "./i18n";
import {store} from "./models";

import './index.css';
import {queryClient} from "./queryClient.ts";

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <Provider store={store}>
            <QueryClientProvider client={queryClient}>
                <I18nextProvider i18n={i18n}>
                    <App/>
                </I18nextProvider>
            </QueryClientProvider>
        </Provider>
    </React.StrictMode>
)
