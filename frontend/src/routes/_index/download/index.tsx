import {queryOptions, useQuery, useQueryClient} from "@tanstack/react-query";
import {Card, Collapse, Empty, Input, List, message, Modal, Tag} from "antd";
import * as api from "../../../apis/download";
import {useDebounce, useRequest} from "ahooks";
import {FileDoneOutlined, FolderViewOutlined} from "@ant-design/icons";
import React, {useMemo, useState} from "react";
import {useTranslation} from "react-i18next";
import ActionButton from "../../../components/ActionButton";
import RouteErrorState from "../../../components/RouteErrorState";
import RoutePendingState from "../../../components/RoutePendingState";
import {createFileRoute, Link} from "@tanstack/react-router";
import VideoDetail from "../../../components/VideoDetail";

export const Route = createFileRoute('/_index/download/')({
    component: Download,
})

function downloadsQueryOptions() {
    return queryOptions({
        queryKey: ['downloads'] as const,
        staleTime: 0,
        gcTime: 60 * 1000,
        retry: 1,
        queryFn: api.getDownloads
    });
}

function Download() {

    const {t} = useTranslation(['download'])
    const queryClient = useQueryClient()
    const {data = [], isPending, isError, refetch} = useQuery(downloadsQueryOptions())
    const [selected, setSelected] = useState<string | undefined>()
    const [keyword, setKeyword] = useState<string>()
    const keywordDebounce = useDebounce(keyword, {wait: 1000})

    const realData = useMemo(() => {
        return data.filter((item: any) => {
            return !keywordDebounce ||
                item.name.indexOf(keywordDebounce) != -1 ||
                item.files.some((sub: any) => (
                    sub.name.indexOf(keywordDebounce) != -1 ||
                    sub.path.indexOf(keywordDebounce) != -1
                ))
        })
    }, [data, keywordDebounce])

    const {run: onComplete} = useRequest(api.completeDownload, {
        manual: true,
        onSuccess: () => {
            message.success(t('download:completeSuccess'))
            queryClient.invalidateQueries({queryKey: ['downloads']})
        }
    })

    const items = realData.map((torrent: any) => (
        {
            key: torrent.hash,
            label: (<span>{torrent.name}</span>),
            children: (
                <List itemLayout="horizontal"
                      dataSource={torrent.files}
                      renderItem={(item: any) => (
                          <List.Item actions={[
                              <ActionButton
                                  key={'organize'}
                                  icon={<FolderViewOutlined/>}
                                  onClick={() => {
                                      setSelected(item.path)
                                  }}
                              >
                                  {t('download:actions.organize')}
                              </ActionButton>
                          ]}>
                              <List.Item.Meta
                                  title={(<span>{item.name}<Tag style={{marginLeft: 5}}
                                                                color='success'>{item.size}</Tag></span>)}
                                  description={item.path}
                              />
                          </List.Item>
                      )}
                />
            ),
            extra: (
                <ActionButton
                    icon={<FileDoneOutlined/>}
                    onClick={() => {
                        Modal.confirm({
                            title: t('download:actions.confirmCompleted'),
                            onOk: () => onComplete(torrent.hash)
                        })
                    }}
                >
                    {t('download:actions.markCompleted')}
                </ActionButton>
            )
        }
    ))

    let content: React.ReactNode;

    if (isPending) {
        content = <RoutePendingState/>;
    } else if (isError) {
        content = (
            <RouteErrorState
                title={t('download:errors.loadTitle')}
                description={t('download:errors.loadDescription')}
                onRetry={async () => {
                    await refetch();
                }}
            />
        );
    } else if (realData.length > 0) {
        content = <Collapse items={items} ghost={true}/>;
    } else {
        content = <Empty description={(<span>{t('download:empty.title')}<Link to={'/setting/download'}>{t('download:actions.configure')}</Link></span>)}/>;
    }

    return (
        <Card title={t('download:pageTitle')}
              extra={(<Input.Search value={keyword} onChange={e => setKeyword(e.target.value)} placeholder={t('download:searchPlaceholder')}/>)}>
            {content}
            <VideoDetail title={t('download:detailTitle')}
                         mode={'download'}
                         width={1100}
                         path={selected}
                         open={!!selected}
                         onCancel={() => setSelected(undefined)}
                         onOk={() => {
                             setSelected(undefined)
                             queryClient.invalidateQueries({queryKey: ['downloads']})
                         }}
            />
        </Card>
    )
}
