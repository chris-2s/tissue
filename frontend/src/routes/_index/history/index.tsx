import {queryOptions, useQuery, useQueryClient} from "@tanstack/react-query";
import {Card, Input, message, Modal, Table, Tag} from "antd";
import {ColumnsType} from "antd/lib/table";
import * as api from "../../../apis/history";
import dayjs from "dayjs";
import {useRequest} from "ahooks";
import React, {useEffect, useState} from "react";
import {DeleteOutlined, EditOutlined} from "@ant-design/icons";
import More from "../../../components/More";
import RouteErrorState from "../../../components/RouteErrorState";
import RoutePendingState from "../../../components/RoutePendingState";
import {createFileRoute, useNavigate} from "@tanstack/react-router";
import VideoDetail from "../../../components/VideoDetail";
import {TransModeOptions} from "../../../utils/constants.ts";
import type {PagedResponse} from "../../../types/video.ts";

export const Route = createFileRoute('/_index/history/')({
    component: History,
})

type HistorySearch = {
    page?: number;
    limit?: number;
    keyword?: string;
};

function historiesQueryOptions(search: HistorySearch) {
    const page = Number(search.page || 1);
    const limit = Number(search.limit || 20);
    const keyword = (search.keyword || '').trim();

    return queryOptions({
        queryKey: ['histories', {page, limit, keyword}] as const,
        staleTime: 30 * 1000,
        gcTime: 5 * 60 * 1000,
        retry: 1,
        queryFn: () => api.getHistories({page, limit, keyword: keyword || undefined}) as Promise<PagedResponse<any[]>>,
    });
}

function History() {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const search = Route.useSearch() as HistorySearch
    const page = Number(search.page || 1)
    const limit = Number(search.limit || 20)
    const keyword = (search.keyword || '').trim()
    const [inputValue, setInputValue] = useState(keyword)
    const [selected, setSelected] = useState<any | undefined>()
    const {data, isPending, isError, refetch} = useQuery(historiesQueryOptions(search))

    useEffect(() => {
        setInputValue(keyword)
    }, [keyword])

    const {run: onDelete} = useRequest(api.deleteHistory, {
        manual: true,
        onSuccess: () => {
            message.success("删除成功")
            queryClient.invalidateQueries({queryKey: ['histories']})
        }
    })

    const columns: ColumnsType<any> = [
        {
            title: '状态',
            dataIndex: 'status',
            render: (value) => (value ? (<Tag color={'success'}>成功</Tag>) : (<Tag color={'error'}>失败</Tag>))
        },
        {
            title: '番号',
            dataIndex: 'num',
            render: (value, record: any) => (
                <div>
                    <b>{value}</b>
                    <div>
                        {record.is_zh && (<Tag color={'blue'}>中文</Tag>)}
                        {record.is_uncensored && (<Tag color={'green'}>无码</Tag>)}
                    </div>
                </div>
            )
        },
        {
            title: '路径',
            dataIndex: 'path',
            render: (_, record: any) => (
                <div style={{WebkitTextSizeAdjust: '100%', fontSize: 14, maxWidth: 680}}>
                    <div>{record.source_path}</div>
                    <div>{'==>'}</div>
                    <div>{record.dest_path}</div>
                </div>
            )
        },
        {
            title: '转移方式',
            dataIndex: 'trans_method',
            render: (value: string) => {
                const method = TransModeOptions.find((i: any) => i.value === value)
                return (
                    <Tag color={method?.color}>{method?.name}</Tag>
                )
            }
        },
        {
            title: '时间',
            dataIndex: 'create_time',
            render: (value) => dayjs(value).format('lll')
        },
        {
            title: '',
            dataIndex: 'operations',
            width: 20,
            fixed: 'right',
            render: (_, record) => (
                !record.is_admin && (
                    <More items={items} onClick={(key) => onMoreClick(key, record)}/>
                )
            )
        }
    ]

    const items = [
        {
            key: 'edit',
            label: '重新整理',
            icon: <EditOutlined/>
        },
        {
            key: 'delete',
            label: '删除记录',
            icon: <DeleteOutlined/>
        },
    ] as any

    function onMoreClick(key: string, record: any) {
        if (key === 'edit') {
            setSelected(record)
        } else if (key === 'delete') {
            Modal.confirm({
                title: '是否确认删除记录',
                onOk: () => {
                    onDelete(record.id)
                }
            })
        }
    }

    function handleSearch(value: string) {
        const nextKeyword = value.trim()
        navigate({
            search: {
                page: 1,
                limit,
                keyword: nextKeyword || undefined
            } as never
        })
    }

    let content: React.ReactNode;

    if (isPending) {
        content = <RoutePendingState/>;
    } else if (isError) {
        content = (
            <RouteErrorState
                title={'历史记录加载失败'}
                description={'请检查网络后重试'}
                onRetry={async () => {
                    await refetch();
                }}
            />
        );
    } else {
        content = (
            <Table
                rowKey={'id'}
                scroll={{x: 'max-content'}}
                columns={columns}
                dataSource={data?.data || []}
                pagination={{
                    current: data?.page || page,
                    pageSize: data?.limit || limit,
                    total: data?.total || 0,
                    showSizeChanger: true,
                    onChange: (nextPage, nextPageSize) => {
                        navigate({
                            search: {
                                page: nextPage,
                                limit: nextPageSize,
                                keyword: keyword || undefined
                            } as never
                        })
                    }
                }}
            />
        );
    }

    return (
        <Card title={'历史记录'}
              extra={(
                  <Input.Search
                      value={inputValue}
                      onChange={e => setInputValue(e.target.value)}
                      onSearch={handleSearch}
                      placeholder={'搜索'}
                  />
              )}>
            {content}
            <VideoDetail title={'重新整理'}
                         mode={'history'}
                         transMode={selected?.status ? 'move' : selected?.trans_mode}
                         width={1100}
                         path={selected?.status ? selected?.dest_path : selected?.source_path}
                         open={!!selected}
                         onCancel={() => setSelected(undefined)}
                          onOk={() => {
                             setSelected(undefined)
                             queryClient.invalidateQueries({queryKey: ['histories']})
                         }}
            />
        </Card>
    )
}
