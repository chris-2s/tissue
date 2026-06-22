import {Avatar, Button, Card, Col, Empty, Row, Space, Tag, Typography, message} from "antd";
import {DeleteOutlined, RightOutlined, UserOutlined} from "@ant-design/icons";
import {queryOptions, useQuery, useQueryClient} from "@tanstack/react-query";
import React from "react";
import {createFileRoute, useNavigate} from "@tanstack/react-router";
import {useRequest} from "ahooks";
import * as actorApi from "../../../apis/actor.ts";
import * as videoApi from "../../../apis/video.ts";
import RouteErrorState from "../../../components/RouteErrorState";
import RoutePendingState from "../../../components/RoutePendingState";

const {Paragraph, Text} = Typography;

export const Route = createFileRoute('/_index/actor-favorite/')({
    component: ActorFavoritePage
});

function favoritesQueryOptions() {
    return queryOptions({
        queryKey: ['actorFavorites'] as const,
        staleTime: 30 * 1000,
        gcTime: 5 * 60 * 1000,
        retry: 1,
        queryFn: actorApi.getActorFavorites
    });
}

function ActorFavoritePage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const {data = [], isPending, isError, refetch} = useQuery(favoritesQueryOptions());

    const {run: onDelete, loading: deleting} = useRequest(actorApi.deleteActorFavorite, {
        manual: true,
        onSuccess: async () => {
            message.success('删除成功');
            await queryClient.invalidateQueries({queryKey: ['actorFavorites']});
        }
    });

    if (isPending) {
        return <RoutePendingState/>;
    }

    if (isError) {
        return (
            <RouteErrorState
                title={'演员收藏加载失败'}
                description={'请检查网络后重试'}
                onRetry={async () => {
                    await refetch();
                }}
            />
        );
    }

    if (data.length === 0) {
        return <Empty description={'无演员收藏'}/>;
    }

    return (
        <Row gutter={[15, 15]}>
            {data.map((favorite) => {
                const aliasText = favorite.actor.alias.filter(Boolean).join(' / ');
                return (
                    <Col key={favorite.id} span={24} md={12} lg={8}>
                        <Card
                            hoverable
                            actions={[
                                <Button key={'open'}
                                        type={'link'}
                                        icon={<RightOutlined/>}
                                        onClick={() => navigate({
                                            to: '/actor',
                                            search: {site_id: favorite.site_id, code: favorite.actor_code} as never
                                        })}>
                                    查看作品
                                </Button>,
                                <Button key={'delete'}
                                        type={'link'}
                                        danger
                                        loading={deleting}
                                        icon={<DeleteOutlined/>}
                                        onClick={() => onDelete(favorite.id)}>
                                    删除
                                </Button>
                            ]}
                        >
                            <div className={'flex gap-4'}>
                                <div className={'h-24 w-24 overflow-hidden rounded-lg bg-black/5'}>
                                    {favorite.actor.thumb ? (
                                        <img
                                            className={'h-full w-full object-cover'}
                                            src={videoApi.getVideoCover(favorite.actor.thumb)}
                                            alt={favorite.actor.name || favorite.actor_code}
                                        />
                                    ) : (
                                        <div className={'flex h-full items-center justify-center'}>
                                            <Avatar size={72} icon={<UserOutlined/>}/>
                                        </div>
                                    )}
                                </div>
                                <div className={'min-w-0 flex-1'}>
                                    <Space wrap size={[8, 8]}>
                                        <Text strong>{favorite.actor.name || favorite.actor_code}</Text>
                                        <Tag variant={'filled'}>{favorite.actor.source.site_name}</Tag>
                                    </Space>
                                    {aliasText ? (
                                        <Paragraph type={'secondary'} className={'!mb-2 !mt-2'} ellipsis={{rows: 2}}>
                                            别名：{aliasText}
                                        </Paragraph>
                                    ) : (
                                        <Paragraph type={'secondary'} className={'!mb-2 !mt-2'}>
                                            暂无别名信息
                                        </Paragraph>
                                    )}
                                    <Text type={'secondary'}>{favorite.actor_code}</Text>
                                </div>
                            </div>
                        </Card>
                    </Col>
                );
            })}
        </Row>
    );
}
