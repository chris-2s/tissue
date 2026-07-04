import {Divider, Typography} from "antd";
import type {ReactNode} from "react";


interface SettingSectionProps {
    title?: string;
    description?: string;
    children: ReactNode;
    divider?: boolean;
}

export default function SettingSection(props: SettingSectionProps) {
    const {title, description, children, divider = true} = props

    return (
        <section>
            {title || description ? (
                <div className={'mb-3'}>
                    {title ? (
                        <Typography.Title level={4} className={'!mb-0.5'}>
                            {title}
                        </Typography.Title>
                    ) : null}
                    {description ? (
                        <Typography.Paragraph className={'!mb-0'}>
                            {description}
                        </Typography.Paragraph>
                    ) : null}
                </div>
            ) : null}
            {children}
            {divider ? <Divider className={'!mt-6 !mb-0'}/> : null}
        </section>
    )
}
