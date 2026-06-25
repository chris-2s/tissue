import {queryOptions, useQuery, useQueryClient} from "@tanstack/react-query";
import {createFileRoute} from "@tanstack/react-router";
import {Button, Card, List, message, Space, Tag, Typography} from "antd";
import {
    ArrowDownOutlined,
    ArrowUpOutlined,
    ReloadOutlined,
    SaveOutlined,
} from "@ant-design/icons";
import React, {useEffect, useMemo, useState} from "react";
import {useRequest} from "ahooks";

import * as api from "../../../apis/site.ts";
import type {MetadataPriorityFieldKey, MetadataPrioritySettings, SiteItem} from "../../../apis/site.ts";
import RouteErrorState from "../../../components/RouteErrorState";
import RoutePendingState from "../../../components/RoutePendingState";


export const Route = createFileRoute('/_index/site/priority')({
    component: SitePriority,
})

const FIELD_TITLES: Record<MetadataPriorityFieldKey, string> = {
    cover: '封面',
    rating: '评分',
    actors: '演员信息',
}

const FIELD_KEYS: MetadataPriorityFieldKey[] = ['cover', 'rating', 'actors']

function metadataPriorityQueryOptions() {
    return queryOptions({
        queryKey: ['metadata-priority'] as const,
        staleTime: 0,
        gcTime: 5 * 60 * 1000,
        retry: 1,
        queryFn: api.getMetadataPriority,
    });
}

function sitesQueryOptions() {
    return queryOptions({
        queryKey: ['sites'] as const,
        staleTime: 0,
        gcTime: 5 * 60 * 1000,
        retry: 1,
        queryFn: api.getSites,
    });
}

type FieldState = Record<MetadataPriorityFieldKey, SiteItem['spider_key'][]>

function buildFieldState(settings?: MetadataPrioritySettings): FieldState {
    return {
        cover: settings?.fields.cover.sites || [],
        rating: settings?.fields.rating.sites || [],
        actors: settings?.fields.actors.sites || [],
    }
}

function SitePriority() {
    const queryClient = useQueryClient()
    const metadataQuery = useQuery(metadataPriorityQueryOptions())
    const sitesQuery = useQuery(sitesQueryOptions())
    const [fieldState, setFieldState] = useState<FieldState>(buildFieldState())

    useEffect(() => {
        if (metadataQuery.data) {
            setFieldState(buildFieldState(metadataQuery.data))
        }
    }, [metadataQuery.data])

    const siteNameMap = useMemo(() => {
        const entries = (sitesQuery.data || []).map((site: SiteItem) => [site.spider_key, site.name] as const)
        return Object.fromEntries(entries) as Record<SiteItem['spider_key'], string>
    }, [sitesQuery.data])

    const hasChanges = useMemo(() => {
        if (!metadataQuery.data) {
            return false
        }
        return FIELD_KEYS.some((fieldKey) => {
            const current = fieldState[fieldKey]
            const original = metadataQuery.data.fields[fieldKey].sites
            return JSON.stringify(current) !== JSON.stringify(original)
        })
    }, [fieldState, metadataQuery.data])

    const {run: onSave, loading: saving} = useRequest(api.saveMetadataPriority, {
        manual: true,
        onSuccess: async () => {
            message.success('保存成功')
            await queryClient.invalidateQueries({queryKey: ['metadata-priority']})
        },
    })

    function moveItem(fieldKey: MetadataPriorityFieldKey, index: number, delta: -1 | 1) {
        setFieldState((prev) => {
            const nextItems = [...prev[fieldKey]]
            const targetIndex = index + delta
            if (targetIndex < 0 || targetIndex >= nextItems.length) {
                return prev
            }
            ;[nextItems[index], nextItems[targetIndex]] = [nextItems[targetIndex], nextItems[index]]
            return {...prev, [fieldKey]: nextItems}
        })
    }

    function resetField(fieldKey: MetadataPriorityFieldKey) {
        const globalSites = metadataQuery.data?.global_sites || []
        setFieldState((prev) => ({...prev, [fieldKey]: [...globalSites]}))
    }

    function resetAll() {
        const globalSites = metadataQuery.data?.global_sites || []
        setFieldState({
            cover: [...globalSites],
            rating: [...globalSites],
            actors: [...globalSites],
        })
    }

    function handleSave() {
        onSave({fields: fieldState})
    }

    if (metadataQuery.isPending || sitesQuery.isPending) {
        return <RoutePendingState/>
    }

    if (metadataQuery.isError || sitesQuery.isError) {
        return (
            <RouteErrorState
                title={'刮削优先级加载失败'}
                description={'请稍后重试'}
                onRetry={async () => {
                    await Promise.all([metadataQuery.refetch(), sitesQuery.refetch()])
                }}
            />
        )
    }

    return (
        <Space direction={'vertical'} size={'large'} style={{display: 'flex'}}>
            <Card
                title={'刮削优先级'}
                extra={(
                    <Space>
                        <Button icon={<ReloadOutlined/>} onClick={resetAll}>恢复全部默认</Button>
                        <Button type={'primary'} icon={<SaveOutlined/>} onClick={handleSave} loading={saving}
                                disabled={!hasChanges}>
                            保存
                        </Button>
                    </Space>
                )}
            >
                <Typography.Text>
                    主优先级
                </Typography.Text>
                <div style={{marginTop: 12}}>
                    <Space wrap>
                        {(metadataQuery.data?.global_sites || []).map((siteKey) => (
                            <Tag key={siteKey} color={'blue'}>{siteNameMap[siteKey] || siteKey}</Tag>
                        ))}
                    </Space>
                </div>
            </Card>

            {FIELD_KEYS.map((fieldKey) => {
                const items = fieldState[fieldKey]
                const globalSites = metadataQuery.data?.global_sites || []
                const isDefault = JSON.stringify(items) === JSON.stringify(globalSites)

                return (
                    <Card
                        key={fieldKey}
                        title={FIELD_TITLES[fieldKey]}
                        extra={(
                            <Space>
                                <Tag color={isDefault ? 'blue' : 'gold'}>{isDefault ? '使用默认' : '已自定义'}</Tag>
                                <Button onClick={() => resetField(fieldKey)}>恢复默认</Button>
                            </Space>
                        )}
                    >
                        <List
                            dataSource={items}
                            renderItem={(siteKey, index) => (
                                <List.Item
                                    actions={[
                                        <Button
                                            key={'up'}
                                            icon={<ArrowUpOutlined/>}
                                            onClick={() => moveItem(fieldKey, index, -1)}
                                            disabled={index === 0}
                                        />,
                                        <Button
                                            key={'down'}
                                            icon={<ArrowDownOutlined/>}
                                            onClick={() => moveItem(fieldKey, index, 1)}
                                            disabled={index === items.length - 1}
                                        />,
                                    ]}
                                >
                                    <Typography.Text>{siteNameMap[siteKey] || siteKey}</Typography.Text>
                                </List.Item>
                            )}
                        />
                    </Card>
                )
            })}
        </Space>
    )
}
