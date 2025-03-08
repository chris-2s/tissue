import {Await as RouterAwait} from "@tanstack/react-router";
import {ReactElement} from "react";

interface AwaitProps {
    promise: Promise<any>
    children: (data: any | undefined, loading: boolean) => ReactElement
}

function Await(props: AwaitProps) {
    const {promise, children} = props
    return (
        <RouterAwait promise={promise} fallback={children(undefined, true)}>
            {(data) => children(data, false)}
        </RouterAwait>
    )
}

export default Await
