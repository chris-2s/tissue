import {Card, Empty, Input, List, Tag, theme, Tooltip} from "antd";
import {useDebounce, useRequest} from "ahooks";
import * as api from "../../../apis/file.ts";
import React, {useMemo, useState} from "react";
import {FolderViewOutlined} from "@ant-design/icons";
import IconButton from "../../../components/IconButton";
import {createFileRoute, Link} from "@tanstack/react-router";
import VideoDetail from "../../../components/VideoDetail";

const {useToken} = theme

export const Route = createFileRoute('/_index/file/')({
    component: File
})

function File() {

    const {token} = useToken()
    const {data = [], loading, refresh} = useRequest(api.getFiles)
    const [selected, setSelected] = useState<string | undefined>()
    const [keyword, setKeyword] = useState<string>()
    const keywordDebounce = useDebounce(keyword, {wait: 1000})

    const realData = useMemo(() => {
        return data.filter((item: any) => {
            return !keywordDebounce ||
                item.name.indexOf(keywordDebounce) != -1 ||
                item.path.indexOf(keywordDebounce) != -1
        })
    }, [data, keywordDebounce])

    return (
        <Card title={'文件列表'} loading={loading}
              extra={(<Input.Search value={keyword} onChange={e => setKeyword(e.target.value)} placeholder={'搜索'}/>)}>
            {realData.length > 0 ? (
                <List itemLayout="horizontal"
                      dataSource={realData}
                      renderItem={(item: any, index) => (
                          <List.Item actions={[
                              <Tooltip title={'整理'}>
                                  <IconButton onClick={() => setSelected(`${item.path}/${item.name}`)}>
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
            ) : (
                <Empty description={(<span>无文件，<Link to={'/setting/file'}>配置文件</Link></span>)}/>
            )}
            <VideoDetail title={'文件整理'}
                         mode={'file'}
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
