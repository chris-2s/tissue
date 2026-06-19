import {queryOptions, useQuery, useQueryClient} from "@tanstack/react-query";
import {Card, Col, Empty, FloatButton, Input, message, Row, Space, Tag, Tooltip} from "antd";
import React, {useState} from "react";
import * as api from "../../../apis/subscribe";
import {useRequest} from "ahooks";
import ModifyModal from "./-components/modifyModal.tsx";
import {createPortal} from "react-dom";
import {HistoryOutlined, PlusOutlined, SearchOutlined} from "@ant-design/icons";
import VideoCover from "../../../components/VideoCover";
import RouteErrorState from "../../../components/RouteErrorState";
import RoutePendingState from "../../../components/RoutePendingState";
import {useFormModal} from "../../../utils/useFormModal.ts";
import {createFileRoute, useNavigate} from "@tanstack/react-router";
import HistoryModal from "./-components/historyModal.tsx";

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
    const floatButtonGroup = document.getElementsByClassName('index-float-button-group')[0]
    const {data = [], isPending, isError, refetch} = useQuery(subscribesQueryOptions())
    const [filter, setFilter] = useState<string>()
    const {setOpen, modalProps} = useFormModal({
        service: api.modifySubscribe,
        onOk: () => {
            setOpen(false)
            return queryClient.invalidateQueries({queryKey: ['subscribes']})
        }
    })

    const [historyModalOpen, setHistoryModalOpen] = useState(false)

    const {run: onDelete} = useRequest(api.deleteSubscribe, {
        manual: true,
        onSuccess: () => {
            message.success("删除成功")
            setOpen(false)
            return queryClient.invalidateQueries({queryKey: ['subscribes']})
        }
    })

    const subscribes = data.filter((item: any) => {
        if (!filter) return true
        return item.title.toUpperCase().includes(filter.toUpperCase()) || item.num.toUpperCase().includes(filter.toUpperCase())
    })

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
            <Row gutter={[15, 15]}>
                {subscribes.map((subscribe: any) => (
                    <Col key={subscribe.id} span={24} md={12} lg={6}>
                        <Card hoverable
                              size={"small"}
                              cover={(<VideoCover src={subscribe.cover} num={subscribe.num}/>)}
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
        <div>
            <Row>
                <Col span={24} lg={{
                    span: 6,
                    offset: 18,
                }}>
                    <Input.Search allowClear enterButton style={{marginBottom: 15}} onSearch={setFilter}/>
                </Col>
            </Row>
            {content}
            <ModifyModal width={1100}
                         onDelete={onDelete}
                         {...modalProps} />
            <HistoryModal open={historyModalOpen}
                          onCancel={() => setHistoryModalOpen(false)}
                          onResubscribe={() => {
                              queryClient.invalidateQueries({queryKey: ['subscribes']})
                              setHistoryModalOpen(false)
                          }}
            />
            {floatButtonGroup && createPortal((<>
                    <FloatButton icon={<PlusOutlined/>} type={'primary'} onClick={() => setOpen(true)}/>
                    <FloatButton icon={<HistoryOutlined/>} onClick={() => setHistoryModalOpen(true)}/>
                </>), floatButtonGroup
            )}
        </div>
    )
}
