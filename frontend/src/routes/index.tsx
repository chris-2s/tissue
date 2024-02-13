import {createBrowserRouter} from "react-router-dom";
import Login from "../pages/login";
import Index from "../pages/index";
import routes from "./routes";
import {List} from "antd";

export default createBrowserRouter([
    {
        path: '/login',
        element: <Login/>
    },
    {
        path: '/',
        element: <Index/>,
        children: flattenRoutes(routes).map((item: any) => (
            {
                path: item.path,
                element: item.element
            }
        ))
    }
])


function flattenRoutes(routes: any) {
    return routes.flatMap((item: any) => {
        if (item.children) {
            return flattenRoutes(item.children)
        } else {
            return [item]
        }
    })
}
