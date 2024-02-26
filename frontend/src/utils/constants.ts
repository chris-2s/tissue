import {theme} from "antd";
import {SunOutlined, MoonOutlined} from "@ant-design/icons";

export const themes = [
    {name: 'default', algorithm: theme.defaultAlgorithm, icon: SunOutlined},
    {name: 'dark', algorithm: theme.darkAlgorithm, icon: MoonOutlined},
]
