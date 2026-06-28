import {queryOptions, useQuery, useQueryClient} from "@tanstack/react-query";
import {Button, Card, Checkbox, Empty, Input, List, Space, Tag, theme, Tooltip} from "antd";
import {useDebounce, useSelections} from "ahooks";
import * as api from "../../../apis/file.ts";
import React, {useMemo, useState} from "react";
import {FolderViewOutlined} from "@ant-design/icons";
import IconButton from "../../../components/IconButton";
import RouteErrorState from "../../../components/RouteErrorState";
import RoutePendingState from "../../../components/RoutePendingState";
import {createFileRoute, Link} from "@tanstack/react-router";
import VideoDetail from "../../../components/VideoDetail";
import BatchModal from "./-components/batchModal.tsx";
import {useTranslation} from "react-i18next";

const {useToken} = theme

export const Route = createFileRoute('/_index/file/')({
    component: File
})

function filesQueryOptions() {
    return queryOptions({
        queryKey: ['files'] as const,
        staleTime: 0,
        gcTime: 60 * 1000,
        retry: 1,
        queryFn: api.getFiles
    });
}

function File() {
    const {t} = useTranslation(['file']);
    const {token} = useToken()
    const queryClient = useQueryClient()
    const {data = [], isPending, isError, refetch} = useQuery(filesQueryOptions())
    const [selectedVideo, setSelectedVideo] = useState<string | undefined>()
    const [keyword, setKeyword] = useState<string>()
    const keywordDebounce = useDebounce(keyword, {wait: 1000})

    const [batchModalOpen, setBatchModalOpen] = useState(false)

    const realData = useMemo(() => {
        return data.filter((item: any) => {
            return !keywordDebounce ||
                item.name.indexOf(keywordDebounce) != -1 ||
                item.path.indexOf(keywordDebounce) != -1
        }).map((item: any) => ({...item, fullPath: `${item.path}/${item.name}`}))
    }, [data, keywordDebounce])

    const {
        selected,
        toggle,
        isSelected,
        allSelected,
        toggleAll,
        partiallySelected
    } = useSelections<string>(realData.map((item: any) => item.fullPath), {
        defaultSelected: []
    })

    let content: React.ReactNode;

    if (isPending) {
        content = <RoutePendingState/>;
    } else if (isError) {
        content = (
            <RouteErrorState
                title={t('file:errors.loadTitle')}
                description={t('file:errors.loadDescription')}
                onRetry={async () => {
                    await refetch();
                }}
            />
        );
    } else if (realData.length > 0) {
        content = (
            <List itemLayout="horizontal"
                  dataSource={realData}
                  renderItem={(item: any) => (
                      <div className={'flex items-center'}>
                          <div className={'mr-3'}>
                              <Checkbox checked={isSelected(item.fullPath)} onClick={() => toggle(item.fullPath)}/>
                          </div>
                          <div className={'flex-1'}>
                              <List.Item actions={[
                                  <Tooltip title={t('file:organize')}>
                                      <IconButton onClick={() => setSelectedVideo(item.fullPath)}>
                                          <FolderViewOutlined style={{fontSize: token.sizeLG}}/>
                                      </IconButton>
                                  </Tooltip>
                              ]}>
                                  <List.Item.Meta
                                      title={(<span>{item.name}<Tag style={{marginLeft: 5}}
                                                                    color='success'>{item.size}</Tag></span>)}
                                      description={item.path}
                                  />
                              </List.Item>
                          </div>
                      </div>
                  )}
            />
        );
    } else {
        content = <Empty description={(<span>{t('file:empty.title')}<Link to={'/setting/file'}>{t('file:empty.configure')}</Link></span>)}/>;
    }

    return (
        <Card title={(
            <div className={'flex items-center'}>
                <Checkbox checked={allSelected} onClick={toggleAll} indeterminate={partiallySelected}/>
                <div className={'ant-card-head-title ml-3'}>{t('file:pageTitle')}</div>
            </div>
        )}
              extra={(
                  <Space>
                      {selected.length > 0 ? (
                          <Button type={'primary'} onClick={() => setBatchModalOpen(true)}>{t('file:batchTitle')}</Button>
                      ) : (
                          <Input.Search className={'w-48'} value={keyword} onChange={e => setKeyword(e.target.value)}
                                        placeholder={t('file:searchPlaceholder')}/>
                      )}
                  </Space>
              )}>
            {content}
            <VideoDetail title={t('file:detailTitle')}
                         mode={'file'}
                         width={1100}
                         path={selectedVideo}
                         open={!!selectedVideo}
                         onCancel={() => setSelectedVideo(undefined)}
                         onOk={() => {
                             setSelectedVideo(undefined)
                             queryClient.invalidateQueries({queryKey: ['files']})
                         }}
            />
            <BatchModal open={batchModalOpen}
                        onCancel={() => setBatchModalOpen(false)}
                        files={selected}
            />
        </Card>
    )
}
