import type {ReactNode} from "react";
import {useEffect} from "react";
import {useDispatch} from "react-redux";
import {Dispatch} from "../../models";

interface Props {
    children?: ReactNode
}

export default function PageFloatButtons({children}: Props) {
    const appDispatch = useDispatch<Dispatch>().app

    useEffect(() => {
        appDispatch.setFloatButtons(children)

        return () => {
            appDispatch.clearFloatButtons()
        }
    }, [appDispatch, children])

    return null
}
