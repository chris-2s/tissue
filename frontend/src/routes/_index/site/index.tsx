import {queryOptions, useQuery, useQueryClient} from "@tanstack/react-query";
import {createFileRoute} from "@tanstack/react-router";
import {Badge, Button, Card, Empty, FloatButton, List, message, Space, Tag, theme} from "antd";
import ModifyModal from "./-components/modifyModal.tsx";
import LoginModal from "./-components/loginModal.tsx";
import {useFormModal} from "../../../utils/useFormModal.ts";
import * as api from "../../../apis/site.ts";
import type {SiteItem} from "../../../apis/site.ts";
import {useRequest} from "ahooks";
import {KeyOutlined, LoadingOutlined, OrderedListOutlined, RedoOutlined} from "@ant-design/icons";
import React, {useMemo, useState} from "react";
import {useTranslation} from "react-i18next";
import RouteErrorState from "../../../components/RouteErrorState";
import RoutePendingState from "../../../components/RoutePendingState";
import PageFloatButtons from "../../../components/PageFloatButtons";
import {useNavigate} from "@tanstack/react-router";


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

    const {t} = useTranslation(['site'])
    const {token} = theme.useToken()
    const queryClient = useQueryClient()
    const navigate = useNavigate()

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
            message.success(t('site:refreshSubmitted'))
            queryClient.invalidateQueries({queryKey: ['sites']})
        }
    })
    const floatButtons = useMemo(() => (
        <>
            <FloatButton
                icon={<OrderedListOutlined/>}
                tooltip={t('site:actions.priority')}
                onClick={() => navigate({to: '/site/priority'})}
            />
            <FloatButton
                icon={testing ? <LoadingOutlined/> : <RedoOutlined/>}
                tooltip={t('site:actions.refresh')}
                onClick={() => onTesting()}
            />
        </>
    ), [navigate, onTesting, t, testing])

    const handleRefreshCookie = (item: SiteItem) => {
        setLoginSite({ id: item.id, name: item.name })
    }

    function renderItem(item: SiteItem) {
        return (
            <List.Item>
                <Badge.Ribbon text={item.status ? t('site:status.enabled') : t('site:status.disabled')}
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
                                <span>{item.alternate_host || t('site:fallback.alternateHost')}</span>
                            </div>
                            <div>
                                <Tag color={'blue'} variant={'filled'}>{t('site:capabilities.metadata')}</Tag>
                                {item.capabilities?.supports_downloads && <Tag color={'green'} variant={'filled'}>{t('site:capabilities.download')}</Tag>}
                                {item.capabilities?.supports_ranking && <Tag color={'gold'} variant={'filled'}>{t('site:capabilities.ranking')}</Tag>}
                                {item.capabilities?.supports_actor && <Tag color={'purple'} variant={'filled'}>{t('site:capabilities.actor')}</Tag>}
                                {item.capabilities?.supports_login && <Tag color={'cyan'} variant={'filled'}>{t('site:capabilities.login')}</Tag>}
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
                                        {t('site:actions.refreshCookie')}
                                    </Button>
                                ) : (
                                    <Button icon={<KeyOutlined />} size={'small'} style={{visibility: 'hidden'}}>
                                        {t('site:actions.refreshCookie')}
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
                title={t('site:errors.loadTitle')}
                description={t('site:errors.loadDescription')}
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
            <Card title={t('site:pageTitle')}>
                <Empty description={(
                    <div>
                        <div>{t('site:empty.title')}</div>
                        <div>{t('site:empty.hintPrefix')}<a onClick={() => onTesting()}>{t('site:empty.refreshLink')}</a></div>
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
