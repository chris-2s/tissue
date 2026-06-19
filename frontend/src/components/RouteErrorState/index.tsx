import {Button, Card, Col, Result, Row, Typography} from "antd";
import React from "react";

const {Text} = Typography;

interface RouteErrorStateProps {
    title: string;
    description: string;
    error?: Error | null;
    onRetry: () => void | Promise<void>;
}

function RouteErrorState(props: RouteErrorStateProps) {
    const {title, description, error, onRetry} = props;

    return (
        <Row gutter={[15, 15]}>
            <Col span={24}>
                <Card>
                    <Result
                        status={'error'}
                        title={title}
                        subTitle={description}
                        extra={(
                            <Button type={'primary'} onClick={() => void onRetry()}>
                                重试
                            </Button>
                        )}
                    />
                    {error?.message && (
                        <div className={'mt-4 text-center'}>
                            <Text type={'secondary'}>{error.message}</Text>
                        </div>
                    )}
                </Card>
            </Col>
        </Row>
    );
}

export default RouteErrorState;
