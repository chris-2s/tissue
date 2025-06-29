import {Col, Row, theme} from "antd";

const {useToken} = theme

function PinPadButton(props: any) {

    const {token} = useToken()

    return (
        <div className={'flex justify-center items-center '}>
            <button className={'size-16 rounded-full text-2xl'}
                    onClick={() => props.onClick(props.children)}
                    style={{
                        border: `solid 1px ${token.colorPrimary}`,
                        background: "none",
                        color: token.colorText
                    }}
            >
                {props.children}
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

    const {token} = useToken()

    return (
        <Row className={'w-64'} gutter={[20, 20]}>
            {new Array(10).fill(0).map((_, i) => (
                <Col span={8}
                     key={i}
                     offset={((i + 1) % 10) === 0 ? 8 : 0}>
                    <PinPadButton onClick={onEnter}>{(i + 1) % 10}</PinPadButton>
                </Col>
            ))}
            {numbers.length > 0 && (
                <Col span={8}>
                    <button className={'w-full h-full border-none rounded-full'}
                            style={{background: 'none', fontSize: 16, color: token.colorText}}
                            onClick={onDelete}
                    >
                        删除
                    </button>
                </Col>
            )}
        </Row>
    )
}


export default PinPad
