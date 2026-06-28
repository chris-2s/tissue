import {Col, Row, theme} from "antd";
import Styles from "./pad.module.css";

const {useToken} = theme

function PinPadButton(props: any) {

    const {token} = useToken()
    const {variant = 'number'} = props

    return (
        <div className={'flex justify-center items-center '}>
            <button className={Styles.button}
                    onClick={() => props.onClick(props.children)}
                    style={{
                        ['--pin-button-border' as string]: token.colorPrimaryBorder,
                        ['--pin-button-bg' as string]: token.colorBgContainer,
                        ['--pin-button-text' as string]: token.colorText,
                        ['--pin-button-active-bg' as string]: token.colorPrimaryBgHover,
                        ['--pin-button-active-border' as string]: token.colorPrimary,
                    }}
            >
                <span className={variant === 'number' ? Styles.buttonLabel : Styles.buttonHint}>
                    {props.children}
                </span>
            </button>
        </div>
    )
}

interface Props {
    numbers: string[];
    onEnter: (num: string) => void
    onDelete: () => void
}

function PinPad(props: Props) {

    const {numbers, onEnter, onDelete} = props

    return (
        <Row className={'w-64'} gutter={[20, 20]}>
            {new Array(10).fill(0).map((_, i) => (
                <Col span={8}
                     key={i}
                     offset={((i + 1) % 10) === 0 ? 8 : 0}>
                    <PinPadButton onClick={onEnter} variant={'number'}>{(i + 1) % 10}</PinPadButton>
                </Col>
            ))}
            {numbers.length > 0 && (
                <Col span={8}>
                    <PinPadButton onClick={onDelete} variant={'action'}>删除</PinPadButton>
                </Col>
            )}
        </Row>
    )
}


export default PinPad
