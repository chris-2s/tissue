import {createFileRoute, Link} from "@tanstack/react-router";
import {Badge, Card, Empty, FloatButton, List, message, Skeleton, Space, Tag, theme} from "antd";
import ModifyModal from "./-components/modifyModal.tsx";
import {useFormModal} from "../../../utils/useFormModal.ts";
import * as api from "../../../apis/site.ts";
import {useRequest} from "ahooks";
import {createPortal} from "react-dom";
import {RedoOutlined} from "@ant-design/icons";
import React from "react";


export const Route = createFileRoute('/_index/site/')({
    component: Site
})

function Site() {

    const {token} = theme.useToken()

    const {data, refresh, loading} = useRequest(api.getSites, {})

    const {modalProps, setOpen} = useFormModal({
        service: api.modifySite,
        onOk: () => {
            setOpen(false)
            refresh()
        }
    })

    const {run: onTesting} = useRequest(api.testingSits, {
        manual: true,
        onSuccess: () => {
            message.success("站点刷新提交成功")
        }
    })

    function renderItem(item: any) {
        return (
            <List.Item>
                <Badge.Ribbon text={item.status ? '启用' : '停用'}
                              color={item.status ? token.colorPrimary : token.colorTextDisabled}>
                    <Card size={'default'}
                          title={(
                              <div className={'flex items-center'}>
                                  <Tag bordered={false}>{item.priority}</Tag>
                                  <div>{item.name}</div>
                              </div>
                          )}
                          className={'cursor-pointer'}
                          onClick={() => setOpen(true, item)}
                    >
                        <Space direction={"vertical"} size={'large'}>
                            <div style={{color: token.colorTextSecondary}}>
                                <span>{item.alternate_host || '未设置替代域名'}</span>
                            </div>
                            <div>
                                <Tag color={'blue'} bordered={false}>元数据</Tag>
                                {item.downloadable && <Tag color={'green'} bordered={false}>下载</Tag>}
                            </div>
                        </Space>
                    </Card>
                </Badge.Ribbon>
            </List.Item>
        )
    }

    if (loading) {
        return (
            <Card>
                <Skeleton active/>
            </Card>
        )
    }

    return (
        <>
            {(data && data.length > 0) ? (
                <List grid={{gutter: 16, xxl: 4, xl: 4, lg: 4, md: 2, xs: 1}}
                      dataSource={data}
                      renderItem={renderItem}/>
            ) : (
                <Card title={'站点'}>
                    <Empty description={(
                        <div>
                            <div>无可用站点</div>
                            <div>请检查网络连接后 <a onClick={() => onTesting()}>刷新站点</a></div>
                        </div>
                    )}/>
                </Card>
            )}
            <ModifyModal {...modalProps} />
            {createPortal((
                    <>
                        <FloatButton icon={<RedoOutlined/>} onClick={() => onTesting()}/>
                    </>
                ), document.getElementsByClassName('index-float-button-group')[0]
            )}
        </>
    )
}
