import {useEffect, useState} from "react";

function useVisibility() {

    const [visible, setVisible] = useState<boolean>(false)

    function handleVisibilityChange() {
        if (document.visibilityState === 'visible') {
            handleForeground();
        } else {
            handleBackground();
        }
    }

    function handleForeground() {
        console.log('App 进入前台');
        setVisible(true);
    }

    function handleBackground() {
        console.log('App 退到后台');
        setVisible(false)
    }


    useEffect(() => {

        window.addEventListener('blur', handleBackground)
        window.addEventListener('focus', handleForeground)

        document.addEventListener("visibilitychange", handleVisibilityChange)

        return () => {
            window.removeEventListener('blur', handleBackground)
            window.removeEventListener('focus', handleForeground)
            document.removeEventListener("visibilitychange", handleVisibilityChange)
        }
    })

    return visible
}

export default useVisibility
