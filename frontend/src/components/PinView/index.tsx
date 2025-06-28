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

const {useToken} = theme

export enum PinMode {
    verify,
    setting
}

interface Props {
    pin: string | null
    onClose: () => void;
    mode: PinMode
}

function PinView(props: Props) {

    const {pin, mode, onClose} = props;
    const {token} = useToken()
    const [numbers, setNumbers] = useState<string[]>([])
    const [repeatNumbers, setRepeatNumbers] = useState<string[]>([])
    const [errorMessage, setErrorMessage] = useState<string>()
    const responsive = useResponsive()

    const goodBoy = useSelector((state: RootState) => state.app?.goodBoy)
    const dispatch = useDispatch<Dispatch>().app

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
                    setErrorMessage('密码错误')
                }
            } else if (mode === PinMode.setting) {
                if (repeatNumbers.length === 0) {
                    setRepeatNumbers(newNumbers)
                    setNumbers([])
                } else {
                    if (repeatNumbers.join('') !== newNumbers.join('')) {
                        setErrorMessage('两次输入密码不匹配')
                        setRepeatNumbers([])
                        setNumbers([])
                    } else {
                        const hash = sha256.create()
                        hash.update(newNumbers.join(''))
                        dispatch.setPin(hash.hex())
                        message.success('密码设置成功')
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
                    由于系统及兼容性限制，可靠性无法保证
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
                            <div style={{color: token.colorText}}>
                                {repeatNumbers.length > 0 ? (
                                    '请再次输入密码 '
                                ) : (
                                    '请输入密码'
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
                                    message.success('密码取消成功')
                                    onClose()
                                }}>清空密码</Button>
                            )}
                            <div className={'h-14 flex items-center'} style={{color: token.colorError}}>
                                {errorMessage}
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
