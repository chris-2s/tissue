import {RouterProvider} from "@tanstack/react-router";
import {useSelector} from "react-redux";

import {RootState} from "./models";
import {queryClient} from "./queryClient.ts";
import {router} from "./routes.tsx";

export default function App() {
    const {userToken} = useSelector((state: RootState) => state.auth);

    return <RouterProvider router={router} context={{userToken, queryClient}}/>;
}
