import Axios from "axios";
import configs from "../configs";
import {message} from "antd";
import i18n from "../i18n";
import {normalizeLocale, toRequestLanguage} from "../i18n/locale";
import {store} from "../models";

function getErrorMessage(data: unknown): string {
    if (typeof data === 'string' && data.trim()) {
        return data;
    }

    if (data && typeof data === 'object') {
        const payload = data as {
            code?: string
            error?: {
                code?: string
                params?: Record<string, string | number | boolean | null>
            }
            details?: string
            message?: string
        };

        const errorCode = payload.error?.code || payload.code;
        const errorParams = payload.error?.params;

        if (errorCode && i18n.exists(`errors:${errorCode}`)) {
            return i18n.t(`errors:${errorCode}`, errorParams);
        }

        if (typeof payload.details === 'string' && payload.details.trim()) {
            return payload.details;
        }

        if (typeof payload.message === 'string' && payload.message.trim()) {
            return payload.message;
        }
    }

    return i18n.t('errors:REQUEST_FAILED');
}

export const request = Axios.create({
    baseURL: configs.BASE_API
})

request.interceptors.request.use(request => {
    const state = store.getState()
    const token = state.auth?.userToken
    if (token) {
        request.headers['Authorization'] = `Bearer ${token}`
    }
    request.headers['Accept-Language'] = toRequestLanguage(normalizeLocale(i18n.resolvedLanguage))
    return request
})

request.interceptors.response.use(response => response, error => {
    if (!error.response) {
        message.error(i18n.t('errors:NETWORK_ERROR'))
        return Promise.reject(error)
    }

    if (error.response.status == 401) {
        store.dispatch.auth.logout()
    } else {
        message.error(getErrorMessage(error.response.data))
    }
    return Promise.reject(error)
})
