import {queryOptions, useQuery, useQueryClient} from "@tanstack/react-query";
import {Button, Card, Empty, List, message, Space, Tag, Typography} from "antd";
import dayjs from "dayjs";
import * as api from "../../../apis/schedule";
import {useRequest} from "ahooks";
import React, {useState} from "react";
import {createFileRoute} from "@tanstack/react-router";
import RoutePendingState from "../../../components/RoutePendingState";
import RouteErrorState from "../../../components/RouteErrorState";
import {useTranslation} from "react-i18next";

export const Route = createFileRoute('/_index/schedule/')({
    component: Schedule,
})

function schedulesQueryOptions() {
    return queryOptions({
        queryKey: ['schedules'] as const,
        staleTime: 0,
        gcTime: 5 * 60 * 1000,
        retry: 1,
        queryFn: api.getSchedules
    });
}

function Schedule() {
    const {t} = useTranslation(['schedule'])
    const queryClient = useQueryClient()
    const [firingKey, setFiringKey] = useState<string>()

    const {data = [], isPending, isError, refetch} = useQuery(schedulesQueryOptions())
    const {run: onFire, loading: onFiring} = useRequest(api.fireSchedule, {
        manual: true,
        onSuccess: () => {
            message.success(t('schedule:fireSuccess'))
            queryClient.invalidateQueries({queryKey: ['schedules']})
            setFiringKey(undefined)
        },
        onError: () => {
            setFiringKey(undefined)
        }
    })

    let content: React.ReactNode;

    if (isPending) {
        content = <RoutePendingState/>;
    } else if (isError) {
        content = (
            <RouteErrorState
                title={t('schedule:errors.loadTitle')}
                description={t('schedule:errors.loadDescription')}
                onRetry={async () => {
                    await refetch();
                }}
            />
        );
    } else if (data.length === 0) {
        content = <Empty description={t('schedule:empty.title')}/>;
    } else {
        content = (
            <List
                grid={{gutter: 16, xl: 3, lg: 2, md: 2, xs: 1}}
                dataSource={data}
                renderItem={(item: any) => (
                    <List.Item>
                        <Card
                            size={'small'}
                            variant={'borderless'}
                            style={{width: '100%', background: 'var(--ant-color-fill-tertiary)'}}
                        >
                            <Space orientation={'vertical'} size={'middle'} style={{width: '100%'}}>
                                <div>
                                    <Typography.Title level={5} style={{margin: 0}}>
                                        {item.name}
                                    </Typography.Title>
                                </div>
                                <div className={'flex items-center justify-between gap-3'}>
                                    <span>{t('schedule:fields.status')}</span>
                                    {item.status ? <Tag color={'success'}>{t('schedule:status.running')}</Tag> : <Tag color={'warning'}>{t('schedule:status.waiting')}</Tag>}
                                </div>
                                <div className={'flex items-center justify-between gap-3'}>
                                    <span>{t('schedule:fields.nextRunTime')}</span>
                                    <span>{dayjs(item.next_run_time).format('lll')}</span>
                                </div>
                                <Button
                                    type={'primary'}
                                    block
                                    onClick={() => {
                                        setFiringKey(item.key)
                                        onFire(item.key)
                                    }}
                                    loading={onFiring && firingKey === item.key}
                                >
                                    {t('schedule:actions.fire')}
                                </Button>
                            </Space>
                        </Card>
                    </List.Item>
                )}
            />
        );
    }

    return (
        <Card title={t('schedule:pageTitle')}>
            {content}
        </Card>
    )
}
