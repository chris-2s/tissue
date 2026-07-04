import {Button, Space, Typography} from "antd";
import type {ReactNode} from "react";
import {useTranslation} from "react-i18next";


export interface SettingNavItem {
    key: string;
    label: string;
    icon: ReactNode;
}

interface SettingNavProps {
    items: SettingNavItem[];
    selected: string;
    onChange: (key: string) => void;
}

export default function SettingNav(props: SettingNavProps) {
    const {items, selected, onChange} = props
    const {t} = useTranslation(['routes'])

    return (
        <div className={'w-[220px] shrink-0 border-r border-[var(--ant-color-border-secondary)] p-4'}>
            <Typography.Text type={'secondary'} className={'mb-3 block px-2 text-xs uppercase tracking-wide'}>
                {t('routes:setting')}
            </Typography.Text>
            <Space direction={'vertical'} size={4} className={'w-full'}>
                {items.map(item => (
                    <Button
                        block
                        icon={item.icon}
                        key={item.key}
                        onClick={() => onChange(item.key)}
                        style={{justifyContent: 'flex-start'}}
                        type={item.key === selected ? 'primary' : 'text'}
                    >
                        {item.label}
                    </Button>
                ))}
            </Space>
        </div>
    )
}
