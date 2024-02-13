import {useEffect, useState} from "react";

export function useScreen() {
    const [size, setSize] = useState<{ width: number, height: number }>(
        {width: window.screen.width, height: window.screen.height}
    )

    useEffect(() => {
        window.addEventListener('resize', onResize)
        return () => {
            window.removeEventListener('resize', onResize)
        }
    })

    function onResize() {
        setSize({width: window.screen.width, height: window.screen.height})
    }

    return size
}
