import {createFileRoute} from "@tanstack/react-router";
import {Search} from "../search";
import * as api from "../../../apis/home";
import {message} from "antd";
import type {VideoDetail} from "../../../types/video";

type SearchVideoView = Omit<VideoDetail, 'actors'> & { actors: string };


export const Route = createFileRoute('/_index/home/detail')({
    component: Search,
    loaderDeps: ({search}) => search,
    loader: async ({deps}) => ({
        data: api.getDetail(deps as api.GetDetailParams).then((data) => ({
            ...data,
            actors: data.actors.map((i) => i.name).filter(Boolean).join(", ")
        } as SearchVideoView)).catch(() => {
            message.error("数据加载失败")
        })
    }),
    staleTime: Infinity
})
