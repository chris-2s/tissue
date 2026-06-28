import Styles from "./editor.module.css";
import RemoteImage from "./index";
import React, {useEffect, useState} from "react";
import {EditOutlined} from "@ant-design/icons";
import {Input, Modal, theme} from "antd";
import {useTranslation} from "react-i18next";

interface Props {
    value?: string
    onChange?: (value?: string) => void
    disabled?: boolean
}

const {useToken} = theme

function RemoteImageEditor(props: Props) {

    const {t} = useTranslation(['video'])
    const {token} = useToken()
    const {value, disabled = false, onChange} = props
    const [modalVisible, setModalVisible] = useState(false)
    const [url, setUrl] = useState<string>()

    useEffect(() => {
        setUrl(value)
    }, [value])

    return (
        <div style={{position: 'relative', borderRadius: 8, overflow: 'hidden'}}>
            <RemoteImage src={value} imageType={'cover'}/>
            {!disabled && (
                <div className={Styles.cover} onClick={() => setModalVisible(true)}>
                    <EditOutlined style={{fontSize: token.sizeMD, color: token.colorWhite}}/>
                </div>
            )}
            <Modal title={t('video:detail.image.modalTitle')}
                   open={modalVisible}
                   onOk={() => {
                       onChange?.(url)
                       setModalVisible(false)
                   }}
                   onCancel={() => setModalVisible(false)}
            >
                <Input value={url} onChange={(event) => setUrl(event.target.value)} placeholder={t('video:detail.image.placeholder')}/>
            </Modal>
        </div>
    )
}

export default RemoteImageEditor
