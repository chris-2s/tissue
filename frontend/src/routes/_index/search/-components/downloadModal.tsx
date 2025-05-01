import {Modal, ModalProps, Tag} from "antd";
import React, {useEffect, useState} from "react";

interface Props extends ModalProps {
    download?: any
    onDownload: (item: any) => void
}

function DownloadModal(props: Props) {

    const {download, onDownload, ...otherProps} = props;
    const [item, setItem] = useState<any>()

    useEffect(() => {
        setItem(download)
    }, [download])

    function renderDownloadTag(label: string, field: string, color: string) {
        return (
            <Tag className={'cursor-pointer'} color={item?.[field] ? color : 'default'}
                 bordered={item?.[field]}
                 onClick={() => {
                     setItem({...item, [field]: !item[field]})
                 }}
            >
                {label}
            </Tag>
        )
    }


    return (
        <Modal title={'是否确认下载：' + item?.name} {...otherProps} onOk={() => onDownload(item)}>
            <div className={'mt-4'}>
                <Tag>{item?.size}</Tag>
                <Tag>{item?.publish_date}</Tag>
            </div>
            <div className={'mt-4'}>
                {renderDownloadTag('高清', 'is_hd', 'red')}
                {renderDownloadTag('中文', 'is_zh', 'blue')}
                {renderDownloadTag('无码', 'is_uncensored', 'green')}
            </div>
        </Modal>
    )
}

export default DownloadModal
