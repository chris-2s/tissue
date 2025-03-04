import {createFileRoute, redirect} from "@tanstack/react-router";

export const Route = createFileRoute('/_index/setting/')({
    beforeLoad: ({}) => {
        throw redirect({
            to: '/setting/app'
        })
    }
})
