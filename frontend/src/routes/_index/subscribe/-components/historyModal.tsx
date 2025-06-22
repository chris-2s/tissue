import {Button, List, message, Modal, ModalProps, Space, Tooltip} from "antd";
import VideoCover from "../../../../components/VideoCover";
import React, {useEffect} from "react";
import {useRequest} from "ahooks";
import * as api from "../../../../apis/subscribe";
import dayjs from "dayjs";
import {DeleteOutlined, RollbackOutlined} from "@ant-design/icons";

interface Props extends ModalProps {
    onResubscribe: () => void;
}

function HistoryModal(props: Props) {

    const {onResubscribe, ...otherProps} = props;

    const {data, loading, run, refresh} = useRequest(api.getSubscribeHistories, {
        manual: true
    })

    const {loading: loadingResubscribe, run: runResubscribe} = useRequest(api.resubscribe, {
        manual: true,
        onSuccess: () => {
            message.success("重新订阅成功")
            onResubscribe()
        }
    })

    const {loading: loadingDelete, run: runDelete} = useRequest(api.deleteSubscribe, {
        manual: true,
        onSuccess: () => {
            message.success("订阅历史删除成功")
            refresh()
        }
    })

    useEffect(() => {
        if (props.open) {
            run()
        }
    }, [props.open]);

    return (
        <Modal title={'订阅历史'} width={800} footer={null} loading={loading} {...otherProps}>
            <List dataSource={data}
                  itemLayout="horizontal"
                  renderItem={(item: any) => (
                      <div className={'relative group'}>
                          <List.Item>
                              <List.Item.Meta
                                  avatar={(
                                      <div className={'w-24'}>
                                          <VideoCover src={item.cover}/>
                                      </div>
                                  )}
                                  title={(
                                      <div className={'text-nowrap overflow-hidden text-ellipsis'}>{item.title}</div>
                                  )}
                                  description={(
                                      <div>
                                          <div
                                              className={'text-nowrap overflow-hidden text-ellipsis'}>{item.actors}</div>
                                          <div className={'text-xs mt-0.5'}>{dayjs(item.update_time).fromNow()}</div>
                                      </div>
                                  )}
                              />
                          </List.Item>
                          <div className={'absolute inset-0 opacity-0 pointer-events-none group-hover:opacity-100 ' +
                              'group-hover:pointer-events-auto transition-opacity duration-500 flex justify-center items-center'}>
                              <Space size="large">
                                  <Tooltip title={'重新订阅'}>
                                      <Button size={"large"} icon={<RollbackOutlined/>} type={'primary'}
                                              shape={"circle"} loading={loadingResubscribe}
                                              onClick={() => runResubscribe(item.id)}/>
                                  </Tooltip>
                                  <Tooltip title={'删除历史'}>
                                      <Button size={"large"} icon={<DeleteOutlined/>} type={'primary'} danger={true}
                                              shape={'circle'} loading={loadingDelete}
                                              onClick={() => runDelete(item.id)}/>
                                  </Tooltip>
                              </Space>
                          </div>
                      </div>
                  )}/>
        </Modal>
    )
}

export default HistoryModal
