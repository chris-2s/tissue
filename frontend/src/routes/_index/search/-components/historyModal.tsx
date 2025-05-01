import {List, Modal, ModalProps} from "antd";
import React, {useEffect, useState} from "react";
import VideoCover from "../../../../components/VideoCover";

interface Props extends ModalProps {
    onClick: (history: any) => void
}

function HistoryModal(props: Props) {

    const {onClick, ...otherProps} = props
    const [histories, setHistories] = useState<any[]>([])

    useEffect(() => {
        if (props.open) {
            setHistories(JSON.parse(localStorage.getItem('search_video_histories') || '[]'))
        }
    }, [props.open])

    return (
        <Modal {...otherProps} footer={null} title={'历史记录'}>
            <List
                itemLayout="horizontal"
                dataSource={histories}
                renderItem={(item: any) => (
                    <List.Item className={'cursor-pointer'}
                               extra={(
                                   <div className={'w-24 m-1'}>
                                       <VideoCover src={item.cover}/>
                                   </div>
                               )}
                               onClick={() => {
                                   onClick(item)
                               }}>
                        <List.Item.Meta
                            title={item.title}
                            description={item.actors}
                        />
                    </List.Item>
                )}
            />
        </Modal>
    )
}

export default HistoryModal
