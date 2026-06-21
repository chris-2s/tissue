import {SunOutlined, MoonOutlined, LaptopOutlined} from "@ant-design/icons";

export const themes = [
    {title: '跟随系统', name: 'system', icon: LaptopOutlined},
    {title: '明亮', name: 'light', icon: SunOutlined},
    {title: '暗黑', name: 'dark', icon: MoonOutlined},
]

export const TransModeOptions = [
    {name: '复制', value: 'copy', color: 'blue'},
    {name: '移动', value: 'move', color: 'purple'},
    {name: '硬连接', value: 'hardlink', color: 'cyan'},
    {name: '软连接', value: 'symlink', color: 'gold'},
]

export const ManualTransModeOptions = [
    {name: '使用系统设置', value: 'system'},
    ...TransModeOptions,
]
