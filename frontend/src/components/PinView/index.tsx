import {Button, Col, message, Row, Space, theme} from "antd";
import Logo from "../../assets/logo.png";
import PinPad from "./pad.tsx";
import React, {useState} from "react";
import {useResponsive} from "ahooks";
import {CloseOutlined, EyeInvisibleOutlined, EyeOutlined} from "@ant-design/icons";
import {sha256} from "js-sha256";
import {createPortal} from "react-dom";
import {useDispatch, useSelector} from "react-redux";
import {Dispatch, RootState} from "../../models";
import Styles from "./index.module.css";
import {vibrateError} from "../../utils/haptics.ts";
import {PinMode} from "./types.ts";
import {useTranslation} from "react-i18next";

const {useToken} = theme

interface Props {
    pin: string | null
    onClose: () => void;
    mode: PinMode
}

function PinView(props: Props) {
    const {t} = useTranslation(['common'])
    const {pin, mode, onClose} = props;
    const {token} = useToken()
    const [numbers, setNumbers] = useState<string[]>([])
    const [repeatNumbers, setRepeatNumbers] = useState<string[]>([])
    const [errorMessage, setErrorMessage] = useState<string>()
    const [errorFeedbackKey, setErrorFeedbackKey] = useState(0)
    const responsive = useResponsive()

    const goodBoy = useSelector((state: RootState) => state.app?.goodBoy)
    const dispatch = useDispatch<Dispatch>().app

    function triggerErrorFeedback(messageText: string) {
        vibrateError()
        setErrorMessage(messageText)
        setErrorFeedbackKey((value) => value + 1)
    }

    function onEnter(num: string) {
        const newNumbers = [...numbers, num]
        setNumbers(newNumbers)
        setErrorMessage(undefined)

        if (newNumbers.length === 4) {
            if (mode === PinMode.verify) {
                const hash = sha256.create()
                hash.update(newNumbers.join(''))
                if (pin === hash.hex()) {
                    onClose()
                } else {
                    setNumbers([])
                    triggerErrorFeedback(t('common:pin.incorrect'))
                }
            } else if (mode === PinMode.setting) {
                if (repeatNumbers.length === 0) {
                    setRepeatNumbers(newNumbers)
                    setNumbers([])
                } else {
                    if (repeatNumbers.join('') !== newNumbers.join('')) {
                        triggerErrorFeedback(t('common:pin.mismatch'))
                        setRepeatNumbers([])
                        setNumbers([])
                    } else {
                        const hash = sha256.create()
                        hash.update(newNumbers.join(''))
                        dispatch.setPin(hash.hex())
                        message.success(t('common:pin.setSuccess'))
                        onClose()
                    }
                }
            }
        }
    }

    function onDelete() {
        if (numbers.length >= 1) {
            numbers.pop()
            setNumbers([...numbers])
        }
    }

    function renderRemark() {
        return (mode === PinMode.setting) && (
            <div className={'flex flex-col items-center mt-8 font-light text-xs'}>
                <div>
                    {t('common:pin.warning')}
                </div>
            </div>
        )
    }

    return createPortal(
        <div className={'fixed top-0 right-0 bottom-0 left-0 z-1000'} style={{background: token.colorBgContainer}}>
            <div className={'h-full w-full flex justify-center items-center'}>
                <Row gutter={[80, 0]}>
                    <Col span={24} md={12}>
                        <div className={'h-full flex flex-col items-center justify-center'}>
                            <img className={'h-20'} src={Logo} alt=""/>
                            <div
                                key={errorFeedbackKey}
                                className={`${Styles.statusPanel} ${errorMessage ? Styles.statusPanelShake : ''}`}
                            >
                                <div style={{color: token.colorText}}>
                                    {repeatNumbers.length > 0 ? (
                                        t('common:pin.repeat')
                                    ) : (
                                        t('common:pin.enter')
                                    )}
                                </div>
                                <Space className={'flex justify-center mt-8'}>
                                    {new Array(4).fill(0).map((_, i) => (
                                        <Button shape={"circle"} size={"small"} key={i}
                                                type={numbers.length > i ? 'primary' : 'default'}/>
                                    ))}
                                </Space>
                                {(pin && mode === PinMode.setting) && (
                                    <Button type={'link'} className={'mt-4'} onClick={() => {
                                        dispatch.setPin(null)
                                        message.success(t('common:pin.cleared'))
                                        onClose()
                                    }}>{t('common:pin.clear')}</Button>
                                )}
                                <div className={'h-14 flex items-center'} style={{color: token.colorError}}>
                                    {errorMessage}
                                </div>
                            </div>
                            {responsive.md && (
                                renderRemark()
                            )}
                        </div>
                    </Col>
                    <Col span={24} md={12}>
                        <div className={'flex flex-col items-center justify-center'}>
                            <PinPad numbers={numbers} onEnter={onEnter} onDelete={onDelete}/>
                        </div>
                        {!responsive.md && (
                            renderRemark()
                        )}
                    </Col>
                </Row>
            </div>
            <div className={'fixed'} style={{
                top: 'calc(10px + env(safe-area-inset-top, 0))',
                right: 'calc(20px + env(safe-area-inset-right, 0))'
            }}>
                {mode === PinMode.setting ? (
                    <Button shape={'circle'} icon={<CloseOutlined/>} onClick={() => onClose()}/>
                ) : (
                    <div className={'mr-2'} style={{fontSize: token.sizeLG, color: token.colorText}}
                         onClick={() => dispatch.setGoodBoy(!goodBoy)}>
                        {goodBoy ? (<EyeInvisibleOutlined/>) : (<EyeOutlined/>)}
                    </div>
                )}
            </div>
        </div>, document.body
    )
}


export default PinView;
