import {Card, Collapse, Empty, Input, List, message, Modal, Space, Tag, theme, Tooltip} from "antd";
import * as api from "../../../apis/download";
import {useDebounce, useRequest} from "ahooks";
import {FileDoneOutlined, FolderViewOutlined} from "@ant-design/icons";
import React, {useMemo, useState} from "react";
import IconButton from "../../../components/IconButton";
import {createFileRoute, Link} from "@tanstack/react-router";
import VideoDetail from "../../../components/VideoDetail";

const {useToken} = theme

export const Route = createFileRoute('/_index/download/')({
    component: Download,
})

function Download() {

    const {token} = useToken()
    const {data = [], loading, refresh} = useRequest(api.getDownloads)
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
            message.success("标记成功")
            refresh()
        }
    })

    const items = realData.map((torrent: any) => (
        {
            key: torrent.hash,
            label: (<span>{torrent.name}</span>),
            children: (
                <List itemLayout="horizontal"
                      dataSource={torrent.files}
                      renderItem={(item: any, index) => (
                          <List.Item actions={[
                              <Tooltip title={'整理'}>
                                  <IconButton onClick={() => {
                                      setSelected(item.path)
                                  }}>
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
                      )}
                />
            ),
            extra: (
                <Space>
                    <Tooltip title={'标记为"整理成功"'}>
                        <IconButton onClick={() => {
                            Modal.confirm({
                                title: '是否确认标记为完成',
                                onOk: () => onComplete(torrent.hash)
                            })
                        }}>
                            <FileDoneOutlined style={{fontSize: token.sizeLG}}/>
                        </IconButton>
                    </Tooltip>
                </Space>
            )
        }
    ))

    return (
        <Card title={'下载列表'} loading={loading}
              extra={(<Input.Search value={keyword} onChange={e => setKeyword(e.target.value)} placeholder={'搜索'}/>)}>
            {realData.length > 0 ? (
                <Collapse items={items} ghost={true}/>
            ) : (
                <Empty description={(<span>无完成下载，<Link to={'/setting/download'}>配置下载</Link></span>)}/>
            )}
            <VideoDetail title={'下载整理'}
                         mode={'download'}
                         width={1100}
                         path={selected}
                         open={!!selected}
                         onCancel={() => setSelected(undefined)}
                         onOk={() => {
                             setSelected(undefined)
                             refresh()
                         }}
            />
        </Card>
    )
}

