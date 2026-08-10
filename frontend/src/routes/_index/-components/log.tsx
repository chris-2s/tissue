import {useEffect, useMemo, useState} from "react";
import {useSelector} from "react-redux";
import {RootState} from "../../../models";
import configs from "../../../configs";
import * as authApi from "../../../apis/auth";
import {Badge, Button, Empty, Input, Segmented, Space, Tag, theme} from "antd";
import {
    ClearOutlined,
    SearchOutlined,
} from "@ant-design/icons";
import {useResponsive} from "ahooks";
import {useTranslation} from "react-i18next";

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
    {key: 'log:levels.all', value: 'ALL'},
    {key: 'log:levels.issue', value: 'ISSUE'},
    {key: 'log:levels.info', value: 'INFO'},
    {key: 'log:levels.debug', value: 'DEBUG'},
] as const

function Log() {

    const {t} = useTranslation(['log'])
    const responsive = useResponsive()
    const {token} = theme.useToken()
    const {userToken} = useSelector((state: RootState) => state.auth)
    const [messages, setMessages] = useState<Message[]>([])
    const [keyword, setKeyword] = useState('')
    const [levelFilter, setLevelFilter] = useState<LevelFilter>('ALL')
    const [status, setStatus] = useState<ConnectionStatus>('connecting')

    useEffect(() => {
        let active = true
        let eventSource: EventSource | null = null
        let backgroundCloseTimer: number | undefined
        let reconnectTimer: number | undefined
        let connectionGeneration = 0
        let messageSequence = 0

        setMessages([])

        function closeConnection(nextStatus: ConnectionStatus = 'closed') {
            connectionGeneration += 1
            window.clearTimeout(reconnectTimer)
            eventSource?.close()
            eventSource = null
            if (active) {
                setStatus(nextStatus)
            }
        }

        function handleMessage(event: MessageEvent<string>) {
            if (!active || !event.data) {
                return
            }

            try {
                const payload = JSON.parse(event.data) as {
                    level?: string
                    time?: string
                    module?: string
                    content?: string
                    raw?: string
                }
                setMessages(data => [{
                    index: `${Date.now()}-${messageSequence++}`,
                    level: payload.level || 'INFO',
                    time: payload.time?.split(" ")[1] || payload.time || '',
                    module: payload.module || '',
                    content: payload.content || payload.raw || '',
                }, ...data].slice(0, 500))
            } catch {
                setMessages(data => [{
                    index: `${Date.now()}-${messageSequence++}`,
                    level: 'INFO',
                    time: '',
                    module: '',
                    content: event.data,
                }, ...data].slice(0, 500))
            }
        }

        async function connect() {
            if (!active || document.hidden || eventSource) {
                return
            }

            const generation = ++connectionGeneration
            setStatus('connecting')

            try {
                const streamToken = await authApi.getLogStreamToken()
                if (!active || document.hidden || generation !== connectionGeneration) {
                    return
                }

                const streamUrl = new URL(`${configs.BASE_API}/home/log`, window.location.origin)
                if (streamUrl.origin !== window.location.origin) {
                    streamUrl.searchParams.set('sse_token', streamToken)
                }

                const source = new EventSource(streamUrl.toString(), {
                    withCredentials: streamUrl.origin === window.location.origin,
                })
                eventSource = source
                source.onopen = () => {
                    if (active && source === eventSource) {
                        setStatus('connected')
                    }
                }
                source.onmessage = handleMessage
                source.onerror = () => {
                    if (active && source === eventSource) {
                        setStatus('error')
                        source.close()
                        eventSource = null
                        window.clearTimeout(reconnectTimer)
                        reconnectTimer = window.setTimeout(() => void connect(), 3000)
                    }
                }
            } catch {
                if (active && generation === connectionGeneration) {
                    setStatus('error')
                }
            }
        }

        function handleVisibilityChange() {
            if (document.hidden) {
                window.clearTimeout(backgroundCloseTimer)
                backgroundCloseTimer = window.setTimeout(() => {
                    if (document.hidden) {
                        closeConnection()
                    }
                }, 5000)
                return
            }

            window.clearTimeout(backgroundCloseTimer)
            void connect()
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)
        void connect()

        return () => {
            active = false
            window.clearTimeout(backgroundCloseTimer)
            window.clearTimeout(reconnectTimer)
            document.removeEventListener('visibilitychange', handleVisibilityChange)
            closeConnection()
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

    function renderStatus() {
        if (status === 'connected') {
            return <Badge status="success" text={t('log:status.connected')}/>
        }
        if (status === 'connecting') {
            return <Badge status="processing" text={t('log:status.connecting')}/>
        }
        if (status === 'closed') {
            return <Badge status="default" text={t('log:status.closed')}/>
        }
        return <Badge status="error" text={t('log:status.error')}/>
    }

    return (
        <div style={{display: 'flex', flexDirection: 'column', gap: 10, flex: 1, minHeight: 0}}>
            <div style={{
                position: 'sticky',
                top: 0,
                zIndex: 1,
                padding: responsive.lg ? '2px 4px 0' : '0 2px',
                background: token.colorBgElevated,
            }}>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8,
                    }}>
                        <Segmented
                            size={'small'}
                            value={levelFilter}
                            options={levelFilterOptions.map((item) => ({label: t(item.key), value: item.value}))}
                            onChange={(value) => setLevelFilter(value as LevelFilter)}
                            style={{minWidth: 0}}
                        />
                        <Space size={8} style={{whiteSpace: 'nowrap'}}>
                            {renderStatus()}
                            <span style={{color: token.colorTextSecondary, fontSize: 12}}>
                                {filteredMessages.length}/{messages.length}
                            </span>
                        </Space>
                    </div>
                    <div style={{
                        display: 'flex',
                        gap: 8,
                    }}>
                        <Input
                            allowClear
                            value={keyword}
                            onChange={event => setKeyword(event.target.value)}
                            prefix={<SearchOutlined/>}
                            placeholder={t('log:controls.searchPlaceholder')}
                        />
                        <Button
                            type={'text'}
                            icon={<ClearOutlined/>}
                            aria-label={t('log:controls.clear')}
                            title={t('log:controls.clear')}
                            onClick={() => setMessages([])}
                            style={{color: token.colorTextSecondary, flex: '0 0 auto'}}
                        />
                    </div>
                </div>
            </div>

            <div
                style={{
                    flex: 1,
                    minHeight: 0,
                    overflowY: 'auto',
                    background: 'transparent',
                    padding: responsive.lg ? '0 4px 8px' : '0 2px 8px',
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
                            description={messages.length === 0 ? t('log:empty.noLogs') : t('log:empty.noMatches')}
                        />
                    </div>
                ) : (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        borderRadius: 10,
                        background: token.colorBgContainer,
                        boxShadow: `inset 0 0 0 1px ${token.colorBorderSecondary}`,
                    }}>
                        {filteredMessages.map(item => (
                            <div
                                key={item.index}
                                style={{
                                    padding: responsive.lg ? '12px 14px' : '12px 10px',
                                    borderBottom: `1px solid ${token.colorBorderSecondary}`,
                                }}
                            >
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: 6,
                                    marginBottom: 6,
                                }}>
                                    <Space size={[8, 8]} wrap>
                                        <Tag color={tagColorMap[item.level]} variant={'filled'}>{item.level}</Tag>
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
                                </div>
                                <div style={{
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word',
                                    color: token.colorText,
                                    lineHeight: 1.6,
                                    fontSize: responsive.md ? 13 : 14,
                                    fontFamily: 'ui-monospace, SFMono-Regular, SFMono-Regular, Consolas, monospace',
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
