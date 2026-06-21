import {queryOptions, useQuery, useQueryClient} from "@tanstack/react-query";
import {createFileRoute} from "@tanstack/react-router";
import {Badge, Button, Card, Empty, FloatButton, List, message, Space, Tag, theme} from "antd";
import ModifyModal from "./-components/modifyModal.tsx";
import LoginModal from "./-components/loginModal.tsx";
import {useFormModal} from "../../../utils/useFormModal.ts";
import * as api from "../../../apis/site.ts";
import type {SiteItem} from "../../../apis/site.ts";
import {useRequest} from "ahooks";
import {KeyOutlined, LoadingOutlined, RedoOutlined} from "@ant-design/icons";
import React, {useMemo, useState} from "react";
import RouteErrorState from "../../../components/RouteErrorState";
import RoutePendingState from "../../../components/RoutePendingState";
import PageFloatButtons from "../../../components/PageFloatButtons";


export const Route = createFileRoute('/_index/site/')({
    component: Site
})

function sitesQueryOptions() {
    return queryOptions({
        queryKey: ['sites'] as const,
        staleTime: 0,
        gcTime: 5 * 60 * 1000,
        retry: 1,
        queryFn: api.getSites
    });
}

function Site() {

    const {token} = theme.useToken()
    const queryClient = useQueryClient()

    const {data = [], isPending, isError, refetch} = useQuery(sitesQueryOptions())

    const {modalProps, setOpen} = useFormModal({
        service: api.modifySite,
        onOk: () => {
            setOpen(false)
            queryClient.invalidateQueries({queryKey: ['sites']})
        }
    })

    const [loginSite, setLoginSite] = useState<{id: number, name: string} | null>(null)

    const {run: onTesting, loading: testing} = useRequest(api.testingSits, {
        manual: true,
        onSuccess: () => {
            message.success("站点刷新提交成功")
            queryClient.invalidateQueries({queryKey: ['sites']})
        }
    })
    const floatButtons = useMemo(() => (
        <FloatButton
            icon={testing ? <LoadingOutlined/> : <RedoOutlined/>}
            onClick={() => onTesting()}
        />
    ), [onTesting, testing])

    const handleRefreshCookie = (item: SiteItem) => {
        setLoginSite({ id: item.id, name: item.name })
    }

    function renderItem(item: SiteItem) {
        return (
            <List.Item>
                <Badge.Ribbon text={item.status ? '启用' : '停用'}
                              color={item.status ? token.colorPrimary : token.colorTextDisabled}>
                    <Card size={'default'}
                          title={(
                              <div className={'flex items-center'}>
                                  <Tag variant={'filled'}>{item.priority}</Tag>
                                  <div>{item.name}</div>
                              </div>
                          )}
                          className={'cursor-pointer'}
                          onClick={() => setOpen(true, item)}
                    >
                        <Space orientation={"vertical"} size={'large'}>
                            <div style={{color: token.colorTextSecondary}}>
                                <span>{item.alternate_host || '未设置替代域名'}</span>
                            </div>
                            <div>
                                <Tag color={'blue'} variant={'filled'}>元数据</Tag>
                                {item.capabilities?.supports_downloads && <Tag color={'green'} variant={'filled'}>下载</Tag>}
                                {item.capabilities?.supports_ranking && <Tag color={'gold'} variant={'filled'}>榜单</Tag>}
                                {item.capabilities?.supports_actor && <Tag color={'purple'} variant={'filled'}>演员页</Tag>}
                                {item.capabilities?.supports_login && <Tag color={'cyan'} variant={'filled'}>登录</Tag>}
                            </div>
                            <div>
                                {item.capabilities?.supports_login ? (
                                    <Button
                                        icon={<KeyOutlined />}
                                        size={'small'}
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleRefreshCookie(item)
                                        }}
                                    >
                                        刷新Cookie
                                    </Button>
                                ) : (
                                    <Button icon={<KeyOutlined />} size={'small'} style={{visibility: 'hidden'}}>
                                        刷新Cookie
                                    </Button>
                                )}
                            </div>
                        </Space>
                    </Card>
                </Badge.Ribbon>
            </List.Item>
        )
    }

    let content: React.ReactNode;

    if (isPending) {
        content = <RoutePendingState/>;
    } else if (isError) {
        content = (
            <RouteErrorState
                title={'站点列表加载失败'}
                description={'请检查网络后重试'}
                onRetry={async () => {
                    await refetch();
                }}
            />
        );
    } else if (data.length > 0) {
        content = (
            <List grid={{gutter: 16, xxl: 4, xl: 4, lg: 4, md: 2, xs: 1}}
                  dataSource={data}
                  renderItem={renderItem}/>
        );
    } else {
        content = (
            <Card title={'站点'}>
                <Empty description={(
                    <div>
                        <div>无可用站点</div>
                        <div>请检查网络连接后 <a onClick={() => onTesting()}>刷新站点</a></div>
                    </div>
                )}/>
            </Card>
        );
    }

    return (
        <>
            {content}
            <PageFloatButtons>{floatButtons}</PageFloatButtons>
            <ModifyModal {...modalProps} />
            <LoginModal 
                siteId={loginSite?.id ?? 0}
                siteName={loginSite?.name ?? ''}
                open={loginSite !== null}
                onClose={() => setLoginSite(null)}
                onSuccess={() => {
                    queryClient.invalidateQueries({queryKey: ['sites']})
                }}
            />
        </>
    )
}
