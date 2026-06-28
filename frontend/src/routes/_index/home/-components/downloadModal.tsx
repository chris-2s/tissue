import {Modal, ModalProps, Tag} from "antd";
import React, {useEffect, useState} from "react";
import type {VideoDownload} from "../../../../types/video";
import {useTranslation} from "react-i18next";

interface Props extends ModalProps {
    download?: VideoDownload
    onDownload: (item: VideoDownload) => void
}

function DownloadModal(props: Props) {
    const {t} = useTranslation(['home']);
    const {download, onDownload, ...otherProps} = props;
    const [item, setItem] = useState<VideoDownload>();

    useEffect(() => {
        setItem(download);
    }, [download]);

    function renderDownloadTag(label: string, field: keyof Pick<VideoDownload, 'is_hd' | 'is_zh' | 'is_uncensored'>, color: string) {
        return (
            <Tag className={'cursor-pointer'} color={item?.[field] ? color : 'default'}
                 bordered={item?.[field]}
                 onClick={() => {
                     if (!item) {
                         return;
                     }
                     setItem({...item, [field]: !item[field]});
                 }}
            >
                {label}
            </Tag>
        );
    }

    return (
        <Modal title={t('home:downloadModal.title', {name: item?.name || ''})} {...otherProps} onOk={() => item && onDownload(item)}>
            <div className={'mt-4'}>
                <Tag>{item?.size}</Tag>
                <Tag>{item?.publish_date}</Tag>
            </div>
            <div className={'mt-4'}>
                {renderDownloadTag(t('home:detail.flags.hd'), 'is_hd', 'red')}
                {renderDownloadTag(t('home:detail.flags.zh'), 'is_zh', 'blue')}
                {renderDownloadTag(t('home:detail.flags.uncensored'), 'is_uncensored', 'green')}
            </div>
        </Modal>
    );
}

export default DownloadModal;
