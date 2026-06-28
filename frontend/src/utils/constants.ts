import {SunOutlined, MoonOutlined} from "@ant-design/icons";
import type {ComponentType} from "react";
import themeAutoSvg from "../assets/theme-auto.svg?raw";

type ThemeOption = {
    titleKey: string
    name: string
    icon?: ComponentType<any>
    svg?: string
}

export const themes: ThemeOption[] = [
    {titleKey: 'common:theme.system', name: 'system', svg: themeAutoSvg},
    {titleKey: 'common:theme.light', name: 'light', icon: SunOutlined},
    {titleKey: 'common:theme.dark', name: 'dark', icon: MoonOutlined},
]

export const TransModeOptions = [
    {value: 'copy', color: 'blue'},
    {value: 'move', color: 'purple'},
    {value: 'hardlink', color: 'cyan'},
    {value: 'symlink', color: 'gold'},
]

export const ManualTransModeOptions = [
    {value: 'system'},
    ...TransModeOptions,
]
