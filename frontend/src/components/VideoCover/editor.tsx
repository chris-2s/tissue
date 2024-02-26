import Styles from "./editor.module.css";
import VideoCover from "./index";
import IconButton from "../IconButton";
import React, {useEffect, useState} from "react";
import {EditOutlined} from "@ant-design/icons";
import {Input, Modal, theme} from "antd";

interface Props {
    value?: string
    onChange?: (value?: string) => void
    disabled?: boolean
}

const {useToken} = theme

function VideoCoverEditor(props: Props) {

    const {token} = useToken()
    const {value, disabled = false, onChange} = props
    const [modalVisible, setModalVisible] = useState(false)
    const [url, setUrl] = useState<string>()

    useEffect(() => {
        setUrl(value)
    }, [value])

    return (
        <div style={{position: 'relative', borderRadius: 8, overflow: 'hidden'}}>
            <VideoCover src={value}/>
            {!disabled && (
                <div className={Styles.cover} onClick={() => setModalVisible(true)}>
                    <EditOutlined style={{fontSize: token.sizeMD, color: token.colorWhite}}/>
                </div>
            )}
            <Modal title={'图片地址'}
                   open={modalVisible}
                   onOk={() => {
                       onChange?.(url)
                       setModalVisible(false)
                   }}
                   onCancel={() => setModalVisible(false)}
            >
                <Input value={url} onChange={(event) => setUrl(event.target.value)} placeholder={'请输入海报地址'}/>
            </Modal>
        </div>
    )
}

export default VideoCoverEditor
