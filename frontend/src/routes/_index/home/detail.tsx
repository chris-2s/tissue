import {createFileRoute} from "@tanstack/react-router";
import {Search} from "../search";
import * as api from "../../../apis/home";
import {message} from "antd";


export const Route = createFileRoute('/_index/home/detail')({
    component: Search,
    loaderDeps: ({search}) => search,
    loader: async ({deps}) => ({
        data: api.getRankingDetail(deps).then(data => ({
            ...data,
            actors: data.actors.map((i: any) => i.name).join(", ")
        })).catch(() => {
            message.error("数据加载失败")
        })
    }),
    staleTime: Infinity
})
