import {createFileRoute, Link} from "@tanstack/react-router";
import {Badge, Button, Card, Empty, FloatButton, List, message, Skeleton, Space, Tag, theme} from "antd";
import ModifyModal from "./-components/modifyModal.tsx";
import LoginModal from "./-components/loginModal.tsx";
import {useFormModal} from "../../../utils/useFormModal.ts";
import * as api from "../../../apis/site.ts";
import type {SiteItem} from "../../../apis/site.ts";
import {useRequest} from "ahooks";
import {createPortal} from "react-dom";
import {KeyOutlined, RedoOutlined} from "@ant-design/icons";
import React, {useState} from "react";


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

    const [loginSite, setLoginSite] = useState<{id: number, name: string} | null>(null)

    const {run: onTesting} = useRequest(api.testingSits, {
        manual: true,
        onSuccess: () => {
            message.success("站点刷新提交成功")
        }
    })

    const handleRefreshCookie = (item: SiteItem) => {
        setLoginSite({ id: item.id, name: item.name })
    }

    function renderItem(item: SiteItem) {
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
                                {item.capabilities?.supports_downloads && <Tag color={'green'} bordered={false}>下载</Tag>}
                                {item.capabilities?.supports_ranking && <Tag color={'gold'} bordered={false}>榜单</Tag>}
                                {item.capabilities?.supports_actor && <Tag color={'purple'} bordered={false}>演员页</Tag>}
                                {item.capabilities?.supports_login && <Tag color={'cyan'} bordered={false}>登录</Tag>}
                            </div>
                            <div>
                                {item.capabilities?.supports_login ? (
                                    <Button
                                        icon={<KeyOutlined />}
                                        size={'small'}
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleRefreshCookie(item)
                                        }}
                                    >
                                        刷新Cookie
                                    </Button>
                                ) : (
                                    <Button icon={<KeyOutlined />} size={'small'} style={{visibility: 'hidden'}}>
                                        刷新Cookie
                                    </Button>
                                )}
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
            <LoginModal 
                siteId={loginSite?.id ?? 0}
                siteName={loginSite?.name ?? ''}
                open={loginSite !== null}
                onClose={() => setLoginSite(null)}
                onSuccess={refresh}
            />
            {createPortal((
                    <>
                        <FloatButton icon={<RedoOutlined/>} onClick={() => onTesting()}/>
                    </>
                ), document.getElementsByClassName('index-float-button-group')[0]
            )}
        </>
    )
}
