import {
    Button,
    Card,
    Col,
    Descriptions,
    Empty,
    Input,
    List, message,
    Row,
    Skeleton,
    Tag,
    Tooltip
} from "antd";
import VideoCover from "../../components/VideoCover";
import React, {useMemo, useState} from "react";
import {CarryOutOutlined, CloudDownloadOutlined, SearchOutlined} from "@ant-design/icons";
import Websites from "../../components/Websites";
import * as api from "../../apis/video";
import * as subscribeApi from "../../apis/subscribe";
import {useRequest} from "ahooks";
import SubscribeModifyModal from "../subscribe/modifyModal.tsx";
import {useFormModal} from "../../utils/useFormModal.ts";

const demo = [
    {
        name: 'JUR-014',
    },
    {
        name: 'JUR-014',
    }
]

function Search() {

    const [video, setVideo] = useState<any>();
    const [links, setLinks] = useState<any[]>();

    const {setOpen: setSubscribeOpen, modalProps: subscribeModalProps} = useFormModal({
        service: subscribeApi.modifySubscribe,
        onOk: () => {
            setSubscribeOpen(false)
            return message.success("订阅添加成功")
        }
    })

    const {run: onSearchVideo, loading: videoSearching} = useRequest(api.scrapeVideo, {
        manual: true,
        onSuccess: (response) => {
            setVideo(response.data.data)
        }
    })

    const videoItems = useMemo(() => {
        if (!video) return undefined;
        return [
            {
                key: 'actors',
                label: '演员',
                span: 24,
                children: video.actors.map((i: any) => i.name).join(", "),
            },
            {
                key: 'num',
                label: '番号',
                span: 8,
                children: video.num,
            },
            {
                key: 'premiered',
                label: '发布日期',
                span: 8,
                children: video.premiered,
            },
            {
                key: 'rating',
                label: '评分',
                span: 8,
                children: video.rating,
            },
            {
                key: 'title',
                label: '标题',
                span: 24,
                children: video.title,
            },
            {
                key: 'outline',
                label: '大纲',
                span: 24,
                children: video.outline,
            },
            {
                key: 'studio',
                label: '制造商',
                span: 8,
                children: video.studio,
            },
            {
                key: 'publisher',
                label: '发行商',
                span: 8,
                children: video.publisher,
            },
            {
                key: 'director',
                label: '导演',
                span: 8,
                children: video.director,
            },
            {
                key: 'tags',
                label: '类别',
                span: 24,
                children: (
                    <div className={'leading-7'}>
                        {video.tags.map((i: any) => (
                            <Tag>{i}</Tag>
                        ))}
                    </div>
                ),
            },
            {
                key: 'series',
                label: '系列',
                span: 16,
                children: video.series,
            },
            {
                key: 'runtime',
                label: '时长',
                span: 8,
                children: video.runtime,
            },
            {
                key: 'websites',
                label: '网站',
                span: 24,
                children: (
                    <Websites value={video.website} readonly/>
                ),
            },
        ]
    }, [video])

    return (
        <Row gutter={[15, 15]}>
            <Col span={24} md={10}>
                <Card>
                    <Input.Search placeholder={'请输入番号'} loading={videoSearching} enterButton
                                  onSearch={(num) => {
                                      setVideo(undefined)
                                      onSearchVideo(num)
                                  }}/>
                    {videoItems ? (
                        <>
                            <div className={'my-4 rounded-lg overflow-hidden'}>
                                <VideoCover src={video.cover}/>
                            </div>
                            <div className={'text-center'}>
                                <Tooltip title={'添加订阅'}>
                                    <Button type={'primary'} icon={<CarryOutOutlined/>} shape={'circle'}
                                            onClick={() => {
                                                setSubscribeOpen(true, {
                                                    ...video,
                                                    actors: video.actors.map((i: any) => i.name).join(", ")
                                                })
                                            }}/>
                                </Tooltip>
                                <Tooltip title={'搜索资源'}>
                                    <Button type={'primary'} icon={<SearchOutlined/>} shape={'circle'}
                                            className={'ml-6'}/>
                                </Tooltip>
                            </div>
                            <Descriptions className={'mt-4'}
                                          layout={'vertical'}
                                          items={videoItems}
                                          column={24}
                                          size={'small'}/>
                        </>
                    ) : (
                        videoSearching ? (
                            <div className={'py-11'}>
                                <Skeleton active/>
                            </div>
                        ) : (
                            <div className={'py-11'}>
                                <Empty/>
                            </div>
                        )
                    )}
                </Card>
            </Col>
            <Col span={24} md={14}>
                <Card title={'资源列表'}>
                    {links ? (
                        <List dataSource={demo} renderItem={(item: any) => (
                            <List.Item actions={[
                                <Tooltip title={'下载'}>
                                    <Button type={'primary'} icon={<CloudDownloadOutlined/>} shape={'circle'}/>
                                </Tooltip>
                            ]}>
                                <List.Item.Meta title={item.name}
                                                description={(
                                                    <div>
                                                        <Tag color={'red'} bordered={false}>高清</Tag>
                                                        <Tag color={'blue'} bordered={false}>中文</Tag>
                                                        <Tag color={'green'} bordered={false}>无码</Tag>
                                                        <span>2.1G</span>
                                                    </div>
                                                )}
                                />
                                <div>content</div>
                            </List.Item>
                        )}/>
                    ) : (
                        <div className={'py-8'}>
                            <Empty/>
                        </div>
                    )}
                </Card>
            </Col>
            <SubscribeModifyModal width={1100}
                                  {...subscribeModalProps} />
        </Row>
    )
}

export default Search
