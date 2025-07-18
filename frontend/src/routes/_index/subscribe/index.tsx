import {Card, Col, Empty, FloatButton, Input, message, Row, Skeleton, Space, Tag, Tooltip} from "antd";
import React, {useState} from "react";
import * as api from "../../../apis/subscribe";
import {useRequest} from "ahooks";
import ModifyModal from "./-components/modifyModal.tsx";
import {createPortal} from "react-dom";
import {HistoryOutlined, PlusOutlined, SearchOutlined} from "@ant-design/icons";
import VideoCover from "../../../components/VideoCover";
import {useFormModal} from "../../../utils/useFormModal.ts";
import {createFileRoute, useNavigate} from "@tanstack/react-router";
import HistoryModal from "./-components/historyModal.tsx";

export const Route = createFileRoute('/_index/subscribe/')({
    component: Subscribe
})

function Subscribe() {

    const navigate = useNavigate()

    const {data = [], loading, refresh} = useRequest(api.getSubscribes, {})
    const [filter, setFilter] = useState<string>()
    const {setOpen, modalProps} = useFormModal({
        service: api.modifySubscribe,
        onOk: () => {
            setOpen(false)
            refresh()
        }
    })

    const [historyModalOpen, setHistoryModalOpen] = useState(false)

    const {run: onDelete} = useRequest(api.deleteSubscribe, {
        manual: true,
        onSuccess: () => {
            message.success("删除成功")
            setOpen(false)
            refresh()
        }
    })

    if (loading) {
        return (
            <Card>
                <Skeleton active/>
            </Card>
        )
    }

    const subscribes = data.filter((item: any) => {
        if (!filter) return true
        return item.title.toUpperCase().includes(filter.toUpperCase()) || item.num.toUpperCase().includes(filter.toUpperCase())
    })

    return (
        <div>
            <Row>
                <Col span={24} lg={{
                    span: 6,
                    offset: 18,
                }}>
                    <Input.Search allowClear enterButton style={{marginBottom: 15}} onSearch={setFilter}/>
                </Col>
            </Row>
            <Row gutter={[15, 15]}>
                {subscribes.length > 0 ? (
                    subscribes.map((subscribe: any) => (
                        <Col key={subscribe.id} span={24} md={12} lg={6}>
                            <Card hoverable
                                  size={"small"}
                                  cover={(<VideoCover src={subscribe.cover}/>)}
                                  onClick={() => setOpen(true, subscribe)}
                            >
                                <Card.Meta title={subscribe.title || subscribe.num}
                                           description={(
                                               <div className={'flex'}>
                                                   <Space size={[0, 'small']} wrap className={'flex-1'}>
                                                       {subscribe.premiered && (
                                                           <Tag bordered={false}>{subscribe.premiered}</Tag>
                                                       )}
                                                       {subscribe.is_hd && (
                                                           <Tag color={'red'} bordered={false}>高清</Tag>)}
                                                       {subscribe.is_zh && (
                                                           <Tag color={'blue'} bordered={false}>中文</Tag>)}
                                                       {subscribe.is_uncensored && (
                                                           <Tag color={'green'} bordered={false}>无码</Tag>)}
                                                   </Space>
                                                   <Tooltip title={'搜索'}>
                                                       <div className={'px-2'} onClick={() => {
                                                           return navigate({
                                                               to: '/search',
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
                    ))
                ) : (
                    <Col span={24}>
                        <Card>
                            <Empty description={'无订阅'}/>
                        </Card>
                    </Col>
                )}
            </Row>
            <ModifyModal width={1100}
                         onDelete={onDelete}
                         {...modalProps} />
            <HistoryModal open={historyModalOpen}
                          onCancel={() => setHistoryModalOpen(false)}
                          onResubscribe={() => {
                              refresh()
                              setHistoryModalOpen(false)
                          }}
            />
            <>
                {createPortal((<>
                        <FloatButton icon={<PlusOutlined/>} type={'primary'} onClick={() => setOpen(true)}/>
                        <FloatButton icon={<HistoryOutlined/>} onClick={() => setHistoryModalOpen(true)}/>
                    </>), document.getElementsByClassName('index-float-button-group')[0]
                )}
            </>
        </div>
    )
}

