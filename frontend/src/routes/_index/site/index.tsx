import {queryOptions, useQuery, useQueryClient} from "@tanstack/react-query";
import {createFileRoute} from "@tanstack/react-router";
import {Button, Card, Empty, FloatButton, List, message, Tooltip, Typography} from "antd";
import ModifyModal from "./-components/modifyModal.tsx";
import LoginModal from "./-components/loginModal.tsx";
import {useFormModal} from "../../../utils/useFormModal.ts";
import * as api from "../../../apis/site.ts";
import type {SiteItem} from "../../../apis/site.ts";
import {useRequest} from "ahooks";
import {KeyOutlined, LoadingOutlined, OrderedListOutlined, RedoOutlined, SettingOutlined} from "@ant-design/icons";
import React, {useMemo, useState} from "react";
import {useTranslation} from "react-i18next";
import RouteErrorState from "../../../components/RouteErrorState";
import RoutePendingState from "../../../components/RoutePendingState";
import PageFloatButtons from "../../../components/PageFloatButtons";
import {useNavigate} from "@tanstack/react-router";
import {getLanguageLabel} from "../../../utils/languages.ts";


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
                onClick={() => navigate({to: '/site/priority'})}
            />
            <FloatButton
                icon={testing ? <LoadingOutlined/> : <RedoOutlined/>}
                onClick={() => onTesting()}
            />
        </>
    ), [navigate, onTesting, testing])

    const handleRefreshCookie = (item: SiteItem) => {
        setLoginSite({ id: item.id, name: item.name })
    }

    function renderItem(item: SiteItem) {
        const capabilities = [
            t('site:capabilities.metadata'),
            item.capabilities?.supports_downloads ? t('site:capabilities.download') : null,
            item.capabilities?.supports_ranking ? t('site:capabilities.ranking') : null,
            item.capabilities?.supports_actor ? t('site:capabilities.actor') : null,
        ].filter(Boolean)
        const openSettings = () => setOpen(true, item)

        return (
            <List.Item className={'h-full'}>
                <Card
                    className={'h-full w-full cursor-pointer overflow-hidden'}
                    hoverable
                    onClick={openSettings}
                    styles={{body: {height: '100%', padding: 16}}}
                >
                    <div className={'flex h-full min-h-44 flex-col'}>
                        <div className={'flex items-start justify-between gap-3'}>
                            <div className={'flex min-w-0 items-baseline gap-3'}>
                                <span className={'shrink-0 font-mono text-xs font-semibold tracking-wider text-[var(--ant-color-text-tertiary)]'}>
                                    {String(item.priority).padStart(2, '0')}
                                </span>
                                <Typography.Title className={'!mb-0 truncate'} level={5}>
                                    {item.name}
                                </Typography.Title>
                            </div>
                            <div className={'flex shrink-0 items-center gap-1.5 text-xs text-[var(--ant-color-text-secondary)]'}>
                                <span className={`h-2 w-2 rounded-full ${item.status ? 'bg-[var(--ant-color-primary)]' : 'bg-[var(--ant-color-text-quaternary)]'}`}/>
                                {item.status ? t('site:status.enabled') : t('site:status.disabled')}
                            </div>
                        </div>

                        <div className={'mt-4 min-w-0'}>
                            <Tooltip title={item.alternate_host || undefined}>
                                <div className={'truncate text-sm text-[var(--ant-color-text-secondary)]'}>
                                    {item.alternate_host || t('site:fallback.alternateHost')}
                                </div>
                            </Tooltip>
                            <div className={'mt-1.5 text-xs font-medium text-[var(--ant-color-text-tertiary)]'}>
                                {getLanguageLabel(item.language)}
                            </div>
                        </div>

                        <div className={'mt-4 min-h-5 text-sm text-[var(--ant-color-text-secondary)]'}>
                            {capabilities.join(' · ')}
                        </div>

                        <div className={'mt-auto flex min-h-8 items-end justify-end gap-1 border-t border-[var(--ant-color-border-secondary)] pt-2'}>
                            {item.capabilities?.supports_login ? (
                                <Button
                                    icon={<KeyOutlined/>}
                                    size={'small'}
                                    type={'text'}
                                    onClick={(event) => {
                                        event.stopPropagation()
                                        handleRefreshCookie(item)
                                    }}
                                >
                                    {t('site:actions.login')}
                                </Button>
                            ) : null}
                            <Button
                                icon={<SettingOutlined/>}
                                size={'small'}
                                type={'text'}
                                onClick={(event) => {
                                    event.stopPropagation()
                                    openSettings()
                                }}
                            >
                                {t('site:actions.settings')}
                            </Button>
                        </div>
                    </div>
                </Card>
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
