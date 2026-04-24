import React, {useEffect, useRef, useState} from 'react'
import {Button, Skeleton, Tag, theme, Tooltip, Typography} from 'antd'
import {CalendarOutlined, DownloadOutlined, EyeOutlined, RiseOutlined} from '@ant-design/icons'
import type {SiteVideo} from '../../../../types/video'
import {request} from '../../../../utils/requests.ts'

const {useToken} = theme
const {Paragraph} = Typography

interface TorrentItemProps {
    item: SiteVideo
    siteId: number
    onDownload: (item: SiteVideo) => void
    onDetail: (item: SiteVideo) => void
    downloading: boolean
}

function TorrentItem(props: TorrentItemProps) {
    const {item, siteId, onDownload, onDetail, downloading} = props
    const {token} = useToken()
    // undefined = loading, null = no cover, string = blob URL
    const [coverSrc, setCoverSrc] = useState<string | null | undefined>(undefined)
    const blobRef = useRef<string | null>(null)

    useEffect(() => {
        if (!item.num || !item.url) {
            setCoverSrc(null)
            return
        }
        request.request({
            url: '/home/cover',
            method: 'get',
            params: {site_id: siteId, num: item.num, url: item.url},
            responseType: 'blob',
        }).then(resp => {
            const url = URL.createObjectURL(resp.data)
            blobRef.current = url
            setCoverSrc(url)
        }).catch(() => setCoverSrc(null))

        return () => {
            if (blobRef.current) {
                URL.revokeObjectURL(blobRef.current)
                blobRef.current = null
            }
        }
    }, [item.num])

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
            {coverSrc === undefined ? (
                <Skeleton.Image active style={{width: '100%', height: 140, borderRadius: 0, display: 'block'}}/>
            ) : coverSrc ? (
                <>
                    <img
                        src={coverSrc}
                        alt={item.title || item.num}
                        style={{width: '100%', maxHeight: 220, objectFit: 'cover', display: 'block'}}
                        onError={() => setCoverSrc(null)}
                    />
                    <div style={{padding: '8px 12px 4px'}}>
                        <Paragraph
                            ellipsis={{rows: 2, tooltip: item.title}}
                            style={{margin: 0, fontWeight: token.fontWeightStrong, fontSize: token.fontSize, color: token.colorText, lineHeight: 1.4}}
                        >
                            {item.title || item.num}
                        </Paragraph>
                    </div>
                </>
            ) : (
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
                        style={{margin: 0, fontWeight: token.fontWeightStrong, fontSize: token.fontSize, color: token.colorText, lineHeight: 1.4}}
                    >
                        {item.title || item.num}
                    </Paragraph>
                </div>
            )}

            <div className="px-3 py-2 flex flex-wrap gap-1" style={{flex: 1}}>
                {item.rank != null && (
                    <Tag color="green" icon={<RiseOutlined/>}>{item.rank} seeds</Tag>
                )}
                {item.publish_date && (
                    <Tag icon={<CalendarOutlined/>} color="default">{item.publish_date}</Tag>
                )}
            </div>

            <div className="px-3 pb-3" style={{display: 'flex', gap: 8}} onClick={e => e.stopPropagation()}>
                <Tooltip title="查看详情">
                    <Button size="small" icon={<EyeOutlined/>} style={{flex: 1}} onClick={() => onDetail(item)}>
                        详情
                    </Button>
                </Tooltip>
                <Tooltip title="发送到下载器">
                    <Button size="small" type="primary" icon={<DownloadOutlined/>} style={{flex: 1}} loading={downloading} onClick={() => onDownload(item)}>
                        下载
                    </Button>
                </Tooltip>
            </div>
        </div>
    )
}

export default TorrentItem
