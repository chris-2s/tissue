import React, {useState} from 'react'
import {Badge, Button, Modal, Space, Tag, theme, Tooltip, Typography} from 'antd'
import {CalendarOutlined, DownloadOutlined, EyeOutlined, RiseOutlined} from '@ant-design/icons'
import type {SiteVideo} from '../../../../types/video'

const {useToken} = theme
const {Text, Paragraph} = Typography

interface TorrentItemProps {
    item: SiteVideo
    siteId: number
    onDownload: (item: SiteVideo) => void
    onDetail: (item: SiteVideo) => void
    downloading: boolean
}

function TorrentItem(props: TorrentItemProps) {
    const {item, onDownload, onDetail, downloading} = props
    const {token} = useToken()

    return (
        <div
            className="overflow-hidden rounded-lg transition-all hover:shadow-md"
            style={{
                background: token.colorBgContainer,
                border: `1px solid ${token.colorBorderSecondary}`,
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
            }}
        >
            {/* coloured header band as cover placeholder */}
            <div
                style={{
                    background: `linear-gradient(135deg, ${token.colorPrimaryBg} 0%, ${token.colorPrimary}33 100%)`,
                    padding: '16px 12px 12px',
                    borderBottom: `1px solid ${token.colorBorderSecondary}`,
                    minHeight: 64,
                    display: 'flex',
                    alignItems: 'flex-start',
                }}
            >
                <Paragraph
                    ellipsis={{rows: 2, tooltip: item.title}}
                    style={{
                        margin: 0,
                        fontWeight: token.fontWeightStrong,
                        fontSize: token.fontSize,
                        color: token.colorText,
                        lineHeight: 1.4,
                    }}
                >
                    {item.title || item.num}
                </Paragraph>
            </div>

            {/* meta row */}
            <div className="px-3 py-2 flex flex-wrap gap-1" style={{flex: 1}}>
                {item.rank != null && (
                    <Tag color="green" icon={<RiseOutlined/>}>
                        {item.rank} seeds
                    </Tag>
                )}
                {item.publish_date && (
                    <Tag icon={<CalendarOutlined/>} color="default">
                        {item.publish_date}
                    </Tag>
                )}
            </div>

            {/* action row */}
            <div
                className="px-3 pb-3"
                style={{display: 'flex', gap: 8}}
                onClick={e => e.stopPropagation()}
            >
                <Tooltip title="查看详情">
                    <Button
                        size="small"
                        icon={<EyeOutlined/>}
                        style={{flex: 1}}
                        onClick={() => onDetail(item)}
                    >
                        详情
                    </Button>
                </Tooltip>
                <Tooltip title="发送到下载器">
                    <Button
                        size="small"
                        type="primary"
                        icon={<DownloadOutlined/>}
                        style={{flex: 1}}
                        loading={downloading}
                        onClick={() => onDownload(item)}
                    >
                        下载
                    </Button>
                </Tooltip>
            </div>
        </div>
    )
}

export default TorrentItem
