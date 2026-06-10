import {List, Modal, ModalProps} from "antd";
import React, {useEffect, useState} from "react";

interface Props extends ModalProps {
    cacheKey: string;
    onClick: (keyword: string) => void;
}

function HistoryModal(props: Props) {
    const {cacheKey, onClick, ...otherProps} = props;
    const [histories, setHistories] = useState<string[]>([]);

    useEffect(() => {
        if (props.open) {
            setHistories(JSON.parse(localStorage.getItem(cacheKey) || '[]'));
        }
    }, [cacheKey, props.open]);

    return (
        <Modal {...otherProps} footer={null} title={'历史记录'}>
            <List
                locale={{emptyText: '暂无历史记录'}}
                dataSource={histories}
                renderItem={(item) => (
                    <List.Item className={'cursor-pointer'} onClick={() => onClick(item)}>
                        <List.Item.Meta title={item}/>
                    </List.Item>
                )}
            />
        </Modal>
    );
}

export default HistoryModal;
