import {useEffect, useMemo, useRef, useState} from "react";
import {useSelector} from "react-redux";
import {RootState} from "../../../models";
import configs from "../../../configs";
import {fetchEventSource} from "@microsoft/fetch-event-source";
import {Badge, Button, Empty, Input, Segmented, Space, Switch, Tag, theme} from "antd";
import {
    ClearOutlined,
    DisconnectOutlined,
    LoadingOutlined,
    SearchOutlined,
} from "@ant-design/icons";
import {useResponsive} from "ahooks";

type ConnectionStatus = 'connecting' | 'connected' | 'error' | 'closed'
type LevelFilter = 'ALL' | 'ISSUE' | 'INFO' | 'DEBUG'

interface Message {
    index: string
    level: string
    module: string
    time: string
    content: string
}

const tagColorMap: { [key: string]: string } = {
    'INFO': 'default',
    'WARNING': 'warning',
    'ERROR': 'error',
    'CRITICAL': 'error',
    'DEBUG': 'processing',
}

const levelFilterOptions = [
    {label: '全部', value: 'ALL'},
    {label: '问题', value: 'ISSUE'},
    {label: '信息', value: 'INFO'},
    {label: '调试', value: 'DEBUG'},
]

function Log() {

    const responsive = useResponsive()
    const {token} = theme.useToken()
    const {userToken} = useSelector((state: RootState) => state.auth)
    const [messages, setMessages] = useState<Message[]>([])
    const [keyword, setKeyword] = useState('')
    const [levelFilter, setLevelFilter] = useState<LevelFilter>('ALL')
    const [autoScroll, setAutoScroll] = useState(true)
    const [status, setStatus] = useState<ConnectionStatus>('connecting')
    const container = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const ctrl = new AbortController();
        let active = true

        setMessages([])
        setStatus('connecting')

        fetchEventSource(`${configs.BASE_API}/home/log`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${userToken}`
            },
            signal: ctrl.signal,
            openWhenHidden: true,
            async onopen(response) {
                if (response.ok) {
                    setStatus('connected')
                    return
                }
                setStatus('error')
                throw new Error(`日志连接失败: ${response.status}`)
            },
            onmessage(msg) {
                if (!active || !msg.data) {
                    return
                }

                try {
                    const payload = JSON.parse(msg.data) as {
                        level?: string
                        time?: string
                        module?: string
                        content?: string
                        raw?: string
                    }
                    setMessages(data => [{
                        index: `${Date.now()}-${data.length}`,
                        level: payload.level || 'INFO',
                        time: payload.time?.split(" ")[1] || payload.time || '',
                        module: payload.module || '',
                        content: payload.content || payload.raw || '',
                    }, ...data].slice(0, 500))
                } catch {
                    setMessages(data => [{
                        index: `${Date.now()}-${data.length}`,
                        level: 'INFO',
                        time: '',
                        module: '',
                        content: msg.data,
                    }, ...data].slice(0, 500))
                }
            },
            onclose() {
                if (active) {
                    setStatus('closed')
                }
            },
            onerror() {
                if (active) {
                    setStatus('error')
                }
            },
        });
        return () => {
            active = false
            ctrl.abort()
        }
    }, [userToken])

    const filteredMessages = useMemo(() => {
        const normalizedKeyword = keyword.trim().toLowerCase()
        return messages.filter(item => {
            const matchedLevel = levelFilter === 'ALL'
                || (levelFilter === 'ISSUE' && ['WARNING', 'ERROR', 'CRITICAL'].includes(item.level))
                || (levelFilter === 'INFO' && item.level === 'INFO')
                || (levelFilter === 'DEBUG' && item.level === 'DEBUG')

            if (!matchedLevel) {
                return false
            }
            if (!normalizedKeyword) {
                return true
            }
            return [item.content, item.module, item.level, item.time]
                .join(' ')
                .toLowerCase()
                .includes(normalizedKeyword)
        })
    }, [keyword, levelFilter, messages])

    useEffect(() => {
        if (!autoScroll) {
            return
        }
        container.current?.scrollTo({
            top: 0,
            behavior: "smooth"
        })
    }, [autoScroll, filteredMessages]);

    function renderStatus() {
        if (status === 'connected') {
            return <Badge status="success" text="已连接"/>
        }
        if (status === 'connecting') {
            return <Badge status="processing" text="连接中"/>
        }
        if (status === 'closed') {
            return <Badge status="default" text="已关闭"/>
        }
        return <Badge status="error" text="连接异常"/>
    }

    return (
        <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
            <div style={{
                position: 'sticky',
                top: 0,
                zIndex: 1,
                padding: responsive.lg ? 12 : 10,
                borderRadius: 8,
                background: token.colorBgLayout,
                border: `1px solid ${token.colorBorderSecondary}`,
            }}>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                }}>
                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8,
                    }}>
                        <Segmented
                            block={!responsive.md}
                            value={levelFilter}
                            options={levelFilterOptions}
                            onChange={(value) => setLevelFilter(value as LevelFilter)}
                        />
                        <Space size={12} wrap>
                            {renderStatus()}
                            <span style={{color: token.colorTextSecondary, fontSize: 12}}>
                                {filteredMessages.length}/{messages.length}
                            </span>
                        </Space>
                    </div>
                    <div style={{
                        display: 'flex',
                        flexDirection: responsive.md ? 'row' : 'column',
                        gap: 8,
                    }}>
                        <Input
                            allowClear
                            value={keyword}
                            onChange={event => setKeyword(event.target.value)}
                            prefix={<SearchOutlined/>}
                            placeholder={'搜索模块或日志内容'}
                        />
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 12,
                            minWidth: responsive.md ? 260 : undefined,
                        }}>
                            <Space size={8}>
                                <Switch checked={autoScroll} onChange={setAutoScroll}/>
                                <span style={{color: token.colorTextSecondary, fontSize: 12}}>自动滚动</span>
                            </Space>
                            <Button
                                type={'text'}
                                size={'small'}
                                icon={<ClearOutlined/>}
                                onClick={() => setMessages([])}
                                style={{
                                    color: token.colorTextSecondary,
                                }}
                            >
                                清空视图
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div
                ref={container}
                style={{
                    height: responsive.lg ? '72vh' : '70vh',
                    overflowY: 'auto',
                    background: token.colorBgContainer,
                    padding: 0,
                }}
            >
                {filteredMessages.length === 0 ? (
                    <div style={{
                        minHeight: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description={messages.length === 0 ? '暂无日志' : '没有匹配的日志'}
                        />
                    </div>
                ) : (
                    <div style={{display: 'flex', flexDirection: 'column'}}>
                        {filteredMessages.map(item => (
                            <div
                                key={item.index}
                                style={{
                                    padding: responsive.lg ? '12px 4px' : '12px 2px',
                                    borderBottom: `1px solid ${token.colorBorderSecondary}`,
                                }}
                            >
                                <div style={{
                                    display: 'flex',
                                    flexDirection: responsive.md ? 'row' : 'column',
                                    alignItems: responsive.md ? 'center' : 'flex-start',
                                    justifyContent: 'space-between',
                                    gap: 8,
                                    marginBottom: 8,
                                }}>
                                    <Space size={[8, 8]} wrap>
                                        <Tag color={tagColorMap[item.level]} bordered={false}>{item.level}</Tag>
                                        {item.time && (
                                            <span style={{color: token.colorTextSecondary, fontSize: 12}}>
                                                {item.time}
                                            </span>
                                        )}
                                        {item.module && (
                                            <span style={{
                                                color: token.colorTextTertiary,
                                                fontSize: 12,
                                                fontFamily: 'monospace',
                                            }}>
                                                {item.module}
                                            </span>
                                        )}
                                    </Space>
                                    {item.level === 'ERROR' || item.level === 'CRITICAL' ? (
                                        <DisconnectOutlined style={{color: token.colorError}}/>
                                    ) : item.level === 'DEBUG' ? (
                                        <LoadingOutlined style={{color: token.colorInfo}}/>
                                    ) : null}
                                </div>
                                <div style={{
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word',
                                    color: token.colorText,
                                    lineHeight: 1.6,
                                    fontSize: responsive.md ? 13 : 14,
                                    fontFamily: 'ui-monospace, SFMono-Regular, SFMono-Regular, Consolas, monospace',
                                    paddingLeft: responsive.md ? 4 : 0,
                                }}>
                                    {item.content || item.module || '-'}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default Log
