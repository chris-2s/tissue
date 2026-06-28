import {queryOptions, useQuery, useQueryClient} from "@tanstack/react-query";
import {Card, Col, Empty, FloatButton, message, Pagination, Row, Space, Tag, Tooltip} from "antd";
import React, {useDeferredValue, useEffect, useMemo, useState} from "react";
import * as api from "../../../apis/subscribe";
import {useRequest} from "ahooks";
import ModifyModal from "./-components/modifyModal.tsx";
import {HistoryOutlined, PlusOutlined, SearchOutlined} from "@ant-design/icons";
import RemoteImage from "../../../components/RemoteImage";
import {IMAGE_TYPES} from "../../../constants/image";
import RouteErrorState from "../../../components/RouteErrorState";
import RoutePendingState from "../../../components/RoutePendingState";
import {useFormModal} from "../../../utils/useFormModal.ts";
import {createFileRoute, useNavigate} from "@tanstack/react-router";
import HistoryModal from "./-components/historyModal.tsx";
import Page from "../../../components/Page";
import PageFloatButtons from "../../../components/PageFloatButtons";
import FilterPanel from "./-components/filterPanel.tsx";
import type {SubscribeFilterValue} from "./-components/filterPanel.utils.ts";

export const Route = createFileRoute('/_index/subscribe/')({
    component: Subscribe
})

function subscribesQueryOptions() {
    return queryOptions({
        queryKey: ['subscribes'] as const,
        staleTime: 30 * 1000,
        gcTime: 5 * 60 * 1000,
        retry: 1,
        queryFn: api.getSubscribes
    });
}

function Subscribe() {

    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const {data = [], isPending, isError, refetch} = useQuery(subscribesQueryOptions())
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(24)
    const [filters, setFilters] = useState<SubscribeFilterValue>({tokens: []})
    const deferredFilters = useDeferredValue(filters)
    const {setOpen, modalProps} = useFormModal({
        service: api.modifySubscribe,
        onOk: () => {
            setOpen(false)
            return queryClient.invalidateQueries({queryKey: ['subscribes']})
        }
    })

    const [historyModalOpen, setHistoryModalOpen] = useState(false)
    const floatButtons = useMemo(() => (
        <>
            <FloatButton icon={<PlusOutlined/>} type={'primary'} onClick={() => setOpen(true)}/>
            <FloatButton icon={<HistoryOutlined/>} onClick={() => setHistoryModalOpen(true)}/>
        </>
    ), [setOpen])

    const {run: onDelete} = useRequest(api.deleteSubscribe, {
        manual: true,
        onSuccess: () => {
            message.success("删除成功")
            setOpen(false)
            return queryClient.invalidateQueries({queryKey: ['subscribes']})
        }
    })

    const subscribes = useMemo(() => data.filter((item: api.Subscribe) => {
        return deferredFilters.tokens.every((token) => {
            const keyword = token.value.trim().toUpperCase()
            if (!keyword) {
                return true
            }

            if (token.kind === "num") {
                return (item.num || "").trim().toUpperCase().includes(keyword)
            }

            if (token.kind === "actor") {
                return (item.actors || "").trim().toUpperCase().includes(keyword)
            }

            return (item.title || "").trim().toUpperCase().includes(keyword)
        })
    }), [data, deferredFilters])

    useEffect(() => {
        setPage(1)
    }, [deferredFilters])

    useEffect(() => {
        const maxPage = Math.max(1, Math.ceil(subscribes.length / pageSize))
        if (page > maxPage) {
            setPage(maxPage)
        }
    }, [page, pageSize, subscribes.length])

    const pagedSubscribes = useMemo(() => {
        const start = (page - 1) * pageSize
        return subscribes.slice(start, start + pageSize)
    }, [page, pageSize, subscribes])

    let content: React.ReactNode;

    if (isPending) {
        content = <RoutePendingState/>;
    } else if (isError) {
        content = (
            <RouteErrorState
                title={'订阅列表加载失败'}
                description={'请检查网络后重试'}
                onRetry={async () => {
                    await refetch();
                }}
            />
        );
    } else if (subscribes.length > 0) {
        content = (
            <>
                <Row gutter={[15, 15]}>
                    {pagedSubscribes.map((subscribe: any) => (
                        <Col key={subscribe.id} span={24} md={12} lg={6}>
                            <Card hoverable
                                  size={"small"}
                                  cover={(<RemoteImage src={subscribe.cover} num={subscribe.num} imageType={IMAGE_TYPES.COVER}/>)}
                                  onClick={() => setOpen(true, subscribe)}
                            >
                                <Card.Meta title={subscribe.title || subscribe.num}
                                           description={(
                                               <div className={'flex'}>
                                                   <Space size={[0, 'small']} wrap className={'flex-1'}>
                                                       {subscribe.premiered && (
                                                           <Tag variant={'filled'}>{subscribe.premiered}</Tag>
                                                       )}
                                                       {subscribe.is_hd && (
                                                           <Tag color={'red'} variant={'filled'}>高清</Tag>)}
                                                       {subscribe.is_zh && (
                                                           <Tag color={'blue'} variant={'filled'}>中文</Tag>)}
                                                       {subscribe.is_uncensored && (
                                                           <Tag color={'green'} variant={'filled'}>无码</Tag>)}
                                                   </Space>
                                                   <Tooltip title={'搜索'}>
                                                       <div className={'px-2'} onClick={() => {
                                                           return navigate({
                                                               to: '/home/detail',
                                                               search: {num: subscribe.num}
                                                           })
                                                       }}>
                                                           <SearchOutlined/>
                                                       </div>
                                                   </Tooltip>
                                               </div>
                                           )}
                                />
                            </Card>
                        </Col>
                    ))}
                </Row>

                <div className={'mt-4 flex justify-center'}>
                    <Pagination
                        current={page}
                        pageSize={pageSize}
                        total={subscribes.length}
                        showSizeChanger
                        pageSizeOptions={[24, 48, 96]}
                        onChange={(nextPage, nextPageSize) => {
                            setPage(nextPage)
                            setPageSize(nextPageSize)
                        }}
                    />
                </div>
            </>
        );
    } else {
        content = (
            <Row gutter={[15, 15]}>
                <Col span={24}>
                    <Empty description={'无订阅'}/>
                </Col>
            </Row>
        );
    }

    return (
        <Page onRefresh={async () => {
            await refetch();
        }}>
            <FilterPanel
                subscribes={data}
                total={data.length}
                filteredTotal={subscribes.length}
                value={filters}
                onChange={setFilters}
            />
            {content}
            <PageFloatButtons>{floatButtons}</PageFloatButtons>
            <ModifyModal width={1100}
                         onDelete={onDelete}
                         {...modalProps} />
            <HistoryModal open={historyModalOpen}
                          onCancel={() => setHistoryModalOpen(false)}
                          onResubscribe={() => {
                              queryClient.invalidateQueries({queryKey: ['subscribes']})
                          }}
            />
        </Page>
    )
}
