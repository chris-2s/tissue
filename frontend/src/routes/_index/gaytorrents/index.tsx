import React, {useState} from 'react'
import {Button, Col, Empty, message, Modal, Row, Select, Skeleton, Typography} from 'antd'
import {HeartOutlined, LockOutlined} from '@ant-design/icons'
import {Await, createFileRoute, redirect, useNavigate, useRouter} from '@tanstack/react-router'
import * as api from '../../../apis/home.ts'
import * as siteApi from '../../../apis/site.ts'
import type {SiteItem} from '../../../apis/site.ts'
import type {SiteVideo} from '../../../types/video.ts'
import TorrentItem from './-components/item.tsx'
import LoginModal from '../site/-components/loginModal.tsx'

const {Title, Text} = Typography

// ── categories ────────────────────────────────────────────────────────────────
const PORN_CATS = [
    'Amateur', 'Anal', 'Asian', 'Bareback', 'Bears', 'Bisexual', 'Black-Men',
    'Chubs', 'Clips', 'Cross-Generation', 'DVD-R', 'Fetish', 'Group-Sex',
    'HD-Movies', 'Hunks', 'Images', 'Interracial', 'Jocks', 'Latino', 'Mature',
    'Member', 'MiddleEast', 'Military', 'Muscle', 'Oral-Sex', 'Solo',
    'Transsexual', 'Twinks', 'Vintage', 'Wrestling',
]
const NONPORN_CATS = [
    'Anime', 'Comedy', 'Comics', 'Coming-Out', 'Documentary', 'Drama', 'DVD-R',
    'Gay-Movies', 'Misc', 'Short-Film', 'Softcore', 'Thriller', 'TV-Episode',
]

const CATEGORY_OPTIONS = [
    {
        label: 'Porn',
        options: PORN_CATS.map(c => ({label: c, value: `porn/${c}`})),
    },
    {
        label: 'Non-Porn',
        options: NONPORN_CATS.map(c => ({label: c, value: `nonporn/${c}`})),
    },
]

// ── route ─────────────────────────────────────────────────────────────────────
interface GTSearch {
    category: string
}

type GTLoaderData = { siteId: number; siteName: string; hasCookies: boolean; items: SiteVideo[] }

export const Route = createFileRoute('/_index/gaytorrents/')({
    component: GayTorrents,
    beforeLoad: ({search}) => {
        if (!(search as Partial<GTSearch>).category) {
            throw redirect({search: {category: 'porn/Asian'}})
        }
    },
    loaderDeps: ({search}) => search as GTSearch,
    loader: async ({deps}) => ({
        data: siteApi.getSites().then((sites: SiteItem[]) => {
            const site = sites.find(s => s.spider_key === 'gaytorrents')
            if (!site || !site.status) {
                return {siteId: 0, siteName: 'GayTorrents', hasCookies: false, items: []} as GTLoaderData
            }
            const hasCookies = !!(site.cookies && site.cookies.trim())
            if (!hasCookies) {
                return {siteId: site.id, siteName: site.name, hasCookies: false, items: []} as GTLoaderData
            }
            return api.getRankings({
                site_id: site.id,
                video_type: deps.category,
                cycle: '',
            }).then(items => ({
                siteId: site.id,
                siteName: site.name,
                hasCookies: true,
                items,
            } as GTLoaderData))
        }).catch(() => ({siteId: 0, siteName: 'GayTorrents', hasCookies: false, items: []} as GTLoaderData))
    }),
    staleTime: 0,
})

// ── page ──────────────────────────────────────────────────────────────────────
function GayTorrents() {
    const {data} = Route.useLoaderData()
    const search = Route.useSearch() as GTSearch
    const navigate = useNavigate()
    const router = useRouter()
    const [downloadingId, setDownloadingId] = useState<string | null>(null)
    const [loginOpen, setLoginOpen] = useState(false)
    const [loginSiteId, setLoginSiteId] = useState<number>(0)
    const [loginSiteName, setLoginSiteName] = useState<string>('GayTorrents')

    const handleCategoryChange = (value: string) => {
        navigate({search: {category: value}})
    }

    const handleDetail = (item: SiteVideo, siteId: number) => {
        navigate({to: '/home/detail', search: {site_id: siteId, num: item.num!, url: item.url!}})
    }

    const handleDownload = (item: SiteVideo, siteId: number) => {
        Modal.confirm({
            title: '发送到下载器',
            content: `确认下载「${item.title || item.num}」？`,
            okText: '确认',
            cancelText: '取消',
            onOk: async () => {
                if (!item.num) return
                setDownloadingId(item.num)
                try {
                    await api.downloadTorrent(siteId, item.num)
                    message.success('已发送到下载器')
                } catch {
                    message.error('下载失败，请检查下载器设置或登录状态')
                } finally {
                    setDownloadingId(null)
                }
            }
        })
    }

    const openLogin = (siteId: number, siteName: string) => {
        setLoginSiteId(siteId)
        setLoginSiteName(siteName)
        setLoginOpen(true)
    }

    const handleLoginSuccess = () => {
        setLoginOpen(false)
        router.invalidate()
    }

    return (
        <div>
            {/* header */}
            <div className="flex items-center gap-3 mb-4">
                <HeartOutlined style={{fontSize: 22, color: '#ff4d4f'}}/>
                <Title level={4} style={{margin: 0}}>GayTorrents</Title>
            </div>

            {/* category selector */}
            <div className="mb-4 flex items-center gap-2">
                <span style={{whiteSpace: 'nowrap', fontWeight: 500}}>分类：</span>
                <Select
                    value={search.category}
                    onChange={handleCategoryChange}
                    options={CATEGORY_OPTIONS}
                    style={{width: 200}}
                    showSearch
                    filterOption={(input, option) =>
                        (option?.label as string ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                />
            </div>

            {/* grid */}
            <Await promise={data} fallback={<Skeleton active/>}>
                {(payload: GTLoaderData = {siteId: 0, siteName: 'GayTorrents', hasCookies: false, items: []}) => {
                    if (payload.siteId === 0) {
                        return (
                            <Empty
                                className="mt-10"
                                description="GayTorrents 站点未启用，请在「站点」设置中启用并配置 Cookie"
                            />
                        )
                    }
                    if (!payload.hasCookies) {
                        return (
                            <div className="mt-10 flex flex-col items-center gap-4">
                                <LockOutlined style={{fontSize: 48, color: '#aaa'}}/>
                                <Text type="secondary">需要登录 GayTorrents 才能浏览内容</Text>
                                <Button
                                    type="primary"
                                    icon={<LockOutlined/>}
                                    onClick={() => openLogin(payload.siteId, payload.siteName)}
                                >
                                    立即登录
                                </Button>
                            </div>
                        )
                    }
                    return payload.items.length > 0 ? (
                        <Row gutter={[12, 12]}>
                            {payload.items.map(item => (
                                <Col key={item.url} span={24} sm={12} lg={8} xl={6}>
                                    <TorrentItem
                                        item={item}
                                        siteId={payload.siteId}
                                        downloading={downloadingId === item.num}
                                        onDetail={i => handleDetail(i, payload.siteId)}
                                        onDownload={i => handleDownload(i, payload.siteId)}
                                    />
                                </Col>
                            ))}
                        </Row>
                    ) : (
                        <Empty className="mt-10" description="该分类暂无内容"/>
                    )
                }}
            </Await>

            <LoginModal
                siteId={loginSiteId}
                siteName={loginSiteName}
                open={loginOpen}
                onClose={() => setLoginOpen(false)}
                onSuccess={handleLoginSuccess}
            />
        </div>
    )
}

export default GayTorrents
