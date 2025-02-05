import ReactDOM from "react-dom/client";
import {Button, Col, message, Row, Space, theme} from "antd";
import Logo from "../../assets/logo.png";
import PinPad from "./pad.tsx";
import {useState} from "react";
import {useResponsive} from "ahooks";
import {CloseOutlined} from "@ant-design/icons";
import {sha256} from "js-sha256";


const containerId = 'pin-view-O5QcQ'

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
                        localStorage.setItem('pin', hash.hex())
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
                    密码仅当前设备有效，退出登录即可清空密码
                </div>
                <div>
                    由于系统及兼容性限制，可靠性无法保证
                </div>
            </div>
        )
    }

    return (
        <div className={'fixed top-0 right-0 bottom-0 left-0 z-[1000]'} style={{background: token.colorBgContainer}}>
            <div className={'h-full w-full flex justify-center items-center'}>
                <Row gutter={[80, 0]}>
                    <Col span={24} md={12}>
                        <div className={'h-full flex flex-col items-center justify-center'}>
                            <img className={'h-20'} src={Logo} alt=""/>
                            <div>
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
            {mode === PinMode.setting && (
                <div className={'fixed'} style={{
                    top: 'calc(10px + env(safe-area-inset-top, 0))',
                    right: 'calc(20px + env(safe-area-inset-right, 0))'
                }}
                     onClick={() => onClose()}
                >
                    <Button shape={'circle'} icon={<CloseOutlined/>}/>
                </div>
            )}
        </div>
    )
}

PinView.show = function (mode: PinMode) {
    return new Promise(resolve => {
        if (document.getElementById(containerId)) {
            return
        }

        const pin = localStorage.getItem('pin')

        if (mode === PinMode.verify && !pin) {
            return
        }

        const container = document.createElement('div');
        container.id = containerId;
        document.body.appendChild(container);

        const root = ReactDOM.createRoot(container)

        function onClose() {
            root.unmount()
            document.body.removeChild(container)
            resolve(undefined)
        }

        root.render((
            <PinView onClose={onClose} mode={mode} pin={pin}/>
        ))
    })
}

export default PinView;
