import {Card, Col, Row, Space, Statistic} from "antd";
import React, {useEffect} from "react";
import {useRequest} from "ahooks";
import * as api from "../../apis/home";


function Home() {

    const {data: system, loading: loadingSystem, run: loadSystem} = useRequest(api.getSystemInfo)
    const {data: videoCount, loading: loadingVideoCount, run: loadVideoCount} = useRequest(api.getVideoCount)
    const {data: disk, loading: loadingDiskSpace, run: loadDiskSpace} = useRequest(api.getDiskSpace)
    const {data: downloadInfo, loading: loadingDownloadInfo, run: loadDownloadInfo} = useRequest(api.getDownloadInfo)

    useEffect(() => {
        const systemTimer = setInterval(() => {
            loadSystem()
        }, 3000)

        const downloadTimer = setInterval(() => {
            loadDownloadInfo()
        }, 3000)
        return () => {
            clearTimeout(systemTimer)
            clearTimeout(downloadTimer)
        }
    }, [])

    return (
        <Row gutter={[15, 15]}>
            <Col span={12} lg={8}>
                <Card bordered={false}>
                    <Statistic
                        title="CPU"
                        value={system?.cpu_percent}
                        suffix="%"
                    />
                </Card>
            </Col>
            <Col span={12} lg={8}>
                <Card bordered={false}>
                    <Statistic
                        title="可用内存"
                        value={system?.memory_available}
                    />
                </Card>
            </Col>
            <Col span={24} lg={8}>
                <Card bordered={false} loading={loadingVideoCount}>
                    <Statistic
                        title="影片数量"
                        value={videoCount}
                        suffix="部"
                    />
                </Card>
            </Col>
            <Col span={24} lg={12}>
                <Card bordered={false}>
                    <Row>
                        <Col span={8}>
                            <Statistic
                                title="视频磁盘"
                                value={disk?.video}
                            />
                        </Col>
                        <Col span={8}>
                            <Statistic
                                title="文件磁盘"
                                value={disk?.file}
                            />
                        </Col>
                        <Col span={8}>
                            <Statistic
                                title="下载磁盘"
                                value={disk?.download || 0}
                            />
                        </Col>
                    </Row>
                </Card>
            </Col><Col span={24} lg={12}>
            <Card bordered={false}>
                <Row>
                    <Col span={8}>
                        <Statistic
                            title="下载速度"
                            value={downloadInfo?.downloadSpeed || 0}
                        />
                    </Col>
                    <Col span={8}>
                        <Statistic
                            title="上传速度"
                            value={downloadInfo?.uploadSpeed || 0}
                        />
                    </Col>
                </Row>
            </Card>
        </Col>
        </Row>
    )
}

export default Home
