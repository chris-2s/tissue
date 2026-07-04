import {Button, Form, Skeleton, Typography} from "antd";
import type {FormInstance} from "antd/es/form";
import type {ReactNode} from "react";


interface SettingPageProps {
    title: string;
    description?: string;
    loading?: boolean;
    saving?: boolean;
    form: FormInstance<any>;
    onFinish: (values: any) => void;
    children: ReactNode;
    submitLabel: string;
}

export default function SettingPage(props: SettingPageProps) {
    const {title, description, loading, saving, form, onFinish, children, submitLabel} = props

    if (loading) {
        return <Skeleton active/>
    }

    return (
        <div className={'w-full max-w-[760px]'}>
            <div className={'mb-3'}>
                <Typography.Title level={3} className={'!mb-1'}>
                    {title}
                </Typography.Title>
                {description ? (
                    <Typography.Paragraph className={'!mb-0'}>
                        {description}
                    </Typography.Paragraph>
                ) : null}
            </div>

            <Form layout={'vertical'} form={form} onFinish={onFinish}>
                <div className={'space-y-6'}>
                    {children}
                </div>
                <div className={'mt-4 flex justify-center'}>
                    <Button className={'min-w-[140px]'} htmlType={"submit"} loading={saving} type={'primary'}>
                        {submitLabel}
                    </Button>
                </div>
            </Form>
        </div>
    )
}
