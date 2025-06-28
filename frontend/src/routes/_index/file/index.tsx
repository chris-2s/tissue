import {Button, Card, Checkbox, Empty, Input, List, Space, Tag, theme, Tooltip} from "antd";
import {useDebounce, useRequest, useSelections} from "ahooks";
import * as api from "../../../apis/file.ts";
import React, {useMemo, useState} from "react";
import {FolderViewOutlined} from "@ant-design/icons";
import IconButton from "../../../components/IconButton";
import {createFileRoute, Link} from "@tanstack/react-router";
import VideoDetail from "../../../components/VideoDetail";
import BatchModal from "./-components/batchModal.tsx";

const {useToken} = theme

export const Route = createFileRoute('/_index/file/')({
    component: File
})

function File() {

    const {token} = useToken()
    const {data = [], loading, refresh} = useRequest(api.getFiles)
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

    return (
        <Card title={(
            <div className={'flex items-center'}>
                <Checkbox checked={allSelected} onClick={toggleAll} indeterminate={partiallySelected}/>
                <div className={'ant-card-head-title ml-3'}>文件列表</div>
            </div>
        )} loading={loading}
              extra={(
                  <Space>
                      {selected.length > 0 ? (
                          <Button type={'primary'} onClick={() => setBatchModalOpen(true)}>批量整理</Button>
                      ) : (
                          <Input.Search className={'w-48'} value={keyword} onChange={e => setKeyword(e.target.value)}
                                        placeholder={'搜索'}/>
                      )}
                  </Space>
              )}>
            {realData.length > 0 ? (
                <List itemLayout="horizontal"
                      dataSource={realData}
                      renderItem={(item: any) => (
                          <div className={'flex items-center'}>
                              <div className={'mr-3'}>
                                  <Checkbox checked={isSelected(item.fullPath)} onClick={() => toggle(item.fullPath)}/>
                              </div>
                              <div className={'flex-1'}>
                                  <List.Item actions={[
                                      <Tooltip title={'整理'}>
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
            ) : (
                <Empty description={(<span>无文件，<Link to={'/setting/file'}>配置文件</Link></span>)}/>
            )}
            <VideoDetail title={'文件整理'}
                         mode={'file'}
                         width={1100}
                         path={selectedVideo}
                         open={!!selectedVideo}
                         onCancel={() => setSelectedVideo(undefined)}
                         onOk={() => {
                             setSelectedVideo(undefined)
                             refresh()
                         }}
            />
            <BatchModal open={batchModalOpen}
                        onCancel={() => setBatchModalOpen(false)}
                        files={selected}
            />
        </Card>
    )
}
