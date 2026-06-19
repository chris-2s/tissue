import {Card, Col, Row, Skeleton} from "antd";
import React from "react";

type RoutePendingVariant = 'detail';

interface RoutePendingStateProps {
    variant?: RoutePendingVariant;
}

function DetailPending() {
    return (
        <Row gutter={[15, 15]}>
            <Col span={24} lg={8} md={12}>
                <Card>
                    <Skeleton.Image active className={'!w-full !h-[320px]'}/>
                    <Skeleton active className={'mt-4'} paragraph={{rows: 8}}/>
                </Card>
            </Col>
            <Col span={24} lg={16} md={12}>
                <Card title={'预览'} className={'mb-4'}>
                    <Skeleton active paragraph={{rows: 4}}/>
                </Card>
                <Card title={'资源列表'}>
                    <Skeleton active paragraph={{rows: 6}}/>
                </Card>
                <Card title={'评论'} className={'mt-4'}>
                    <Skeleton active paragraph={{rows: 5}}/>
                </Card>
            </Col>
        </Row>
    );
}

function RoutePendingState(props: RoutePendingStateProps) {
    const {variant = 'detail'} = props;

    switch (variant) {
        case 'detail':
        default:
            return <DetailPending/>;
    }
}

export default RoutePendingState;
