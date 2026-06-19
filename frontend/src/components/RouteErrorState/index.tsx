import {ReloadOutlined} from "@ant-design/icons";
import {Button, Typography} from "antd";
import React from "react";

const {Paragraph, Title} = Typography;

interface RouteErrorStateProps {
    title: string;
    description: string;
    onRetry: () => void | Promise<void>;
}

function RouteErrorState(props: RouteErrorStateProps) {
    const {title, description, onRetry} = props;

    return (
        <div className={'flex flex-col items-center py-10 text-center'}>
            <Button
                type={'primary'}
                shape={'circle'}
                size={'large'}
                icon={<ReloadOutlined/>}
                onClick={() => void onRetry()}
            />
            <Title level={4} className={'!mt-4 !mb-2'}>{title}</Title>
            <Paragraph type={'secondary'} className={'!mb-0'}>
                {description}
            </Paragraph>
        </div>
    );
}

export default RouteErrorState;
