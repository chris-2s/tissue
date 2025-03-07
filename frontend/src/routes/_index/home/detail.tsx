import {createFileRoute} from "@tanstack/react-router";
import {Search} from "../search";

export const Route = createFileRoute('/_index/home/detail')({
    component: Search,
})
