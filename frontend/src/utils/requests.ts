import Axios from "axios";
import configs from "../configs";
import {message} from "antd";
import {store} from "../models";


export const request = Axios.create({
    baseURL: configs.BASE_API
})

request.interceptors.request.use(request => {
    const token = store.getState().auth?.userToken
    if (token) {
        request.headers['Authorization'] = `Bearer ${token}`
    }
    return request
})

request.interceptors.response.use(response => response, error => {
    if (error.response.status == 401) {
        store.dispatch.auth.logout()
    } else if (error.response.data) {
        message.error(error.response.data)
    }
    return Promise.reject(error)
})
