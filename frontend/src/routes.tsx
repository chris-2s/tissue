import {
    CarryOutOutlined,
    CloudDownloadOutlined,
    FolderOpenOutlined,
    HistoryOutlined,
    HomeOutlined,
    InfoCircleOutlined,
    MenuOutlined,
    ScheduleOutlined,
    SearchOutlined,
    SettingOutlined,
    UserOutlined,
    VideoCameraOutlined,
    GlobalOutlined,
    WomanOutlined,
} from "@ant-design/icons";
import {createRouter} from "@tanstack/react-router";
import type {ReactNode} from "react";
import {queryClient} from "./queryClient.ts";
import {routeTree} from "./routeTree.gen.ts";

export const router = createRouter({
    routeTree,
    context: {
        userToken: undefined,
        queryClient,
    },
    scrollRestoration: true
})

declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router
    }
}

export interface NavigationRouteItem {
    titleKey: string
    path?: string
    icon?: ReactNode
    type?: 'group'
    hidden?: boolean
    group?: string
    children?: NavigationRouteItem[]
}

export default [
    {
        titleKey: 'home',
        path: '/home',
        icon: (<HomeOutlined/>),
    },
    {
        titleKey: 'menu',
        path: '/menu',
        icon: (<MenuOutlined/>),
        hidden: true,
    },
    {
        titleKey: 'organize',
        type: 'group',
        children: [
            {
                titleKey: 'video',
                path: '/video',
                icon: (<VideoCameraOutlined/>),
            },
            {
                titleKey: 'file',
                path: '/file',
                icon: (<FolderOpenOutlined/>),
            },
            {
                titleKey: 'download',
                path: '/download',
                icon: (<CloudDownloadOutlined/>),
            },
            {
                titleKey: 'history',
                path: '/history',
                icon: (<HistoryOutlined/>),
            },
        ]
    },
    {
        titleKey: 'subscribe',
        type: 'group',
        children: [
            {
                titleKey: 'subscribe',
                path: '/subscribe',
                icon: (<CarryOutOutlined/>),
            },
            {
                titleKey: 'actorFavorite',
                path: '/actor-favorite',
                icon: (<WomanOutlined />),
            },
            {
                titleKey: 'search',
                path: '/search',
                icon: (<SearchOutlined/>),
            },
            {
                titleKey: 'site',
                path: '/site',
                icon: (<GlobalOutlined />),
            },
        ]
    },
    {
        titleKey: 'setting',
        type: 'group',
        children: [
            {
                titleKey: 'user',
                path: '/user',
                icon: (<UserOutlined/>),
                group: 'system'
            },
            {
                titleKey: 'setting',
                path: '/setting',
                icon: (<SettingOutlined/>),
                group: 'system'
            },
            {
                titleKey: 'schedule',
                path: '/schedule',
                icon: (<ScheduleOutlined/>),
                group: 'system'
            },
            {
                titleKey: 'about',
                path: '/about',
                icon: (<InfoCircleOutlined/>),
                group: 'system'
            },
        ]
    }
] as NavigationRouteItem[]
