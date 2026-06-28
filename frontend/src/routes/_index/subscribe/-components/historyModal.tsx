import {DeleteOutlined, MoreOutlined, RollbackOutlined, SearchOutlined} from "@ant-design/icons";
import {useRequest} from "ahooks";
import {Button, Dropdown, Empty, Grid, List, message, Modal, ModalProps, Pagination, Popconfirm, Space, Spin, Tag, Typography} from "antd";
import dayjs from "dayjs";
import React, {useEffect, useMemo, useState} from "react";
import {useRouter} from "@tanstack/react-router";
import {useTranslation} from "react-i18next";

import * as api from "../../../../apis/subscribe";
import RemoteImage from "../../../../components/RemoteImage";
import {IMAGE_TYPES} from "../../../../constants/image";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 12;
const PAGE_SIZE_OPTIONS = [12, 24, 48];

interface Props extends ModalProps {
    onResubscribe: () => void;
}

function HistoryModal(props: Props) {
    const {t} = useTranslation(['subscribe', 'common']);
    const {onResubscribe, open, ...otherProps} = props;
    const router = useRouter();
    const screens = Grid.useBreakpoint();
    const [page, setPage] = useState(DEFAULT_PAGE);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

    const {data, loading, run} = useRequest(api.getSubscribeHistories, {
        manual: true,
    });

    const pagination = useMemo(() => ({
        current: data?.page || page,
        pageSize: data?.limit || pageSize,
        total: data?.total || 0,
    }), [data, page, pageSize]);

    const refresh = (nextPage = page, nextPageSize = pageSize) => {
        run({page: nextPage, limit: nextPageSize});
    };

    const {loading: loadingResubscribe, run: runResubscribe} = useRequest(api.resubscribe, {
        manual: true,
        onSuccess: () => {
            message.success(t('subscribe:history.resubscribeSuccess'));
            onResubscribe();
            refresh();
        }
    });

    const {loading: loadingDelete, run: runDelete} = useRequest(api.deleteSubscribe, {
        manual: true,
        onSuccess: () => {
            message.success(t('subscribe:history.deleteSuccess'));
            const nextTotal = Math.max(0, (pagination.total || 0) - 1);
            const maxPage = Math.max(1, Math.ceil(nextTotal / pageSize));
            const nextPage = Math.min(page, maxPage);
            setPage(nextPage);
            refresh(nextPage, pageSize);
        }
    });

    useEffect(() => {
        if (open) {
            setPage(DEFAULT_PAGE);
            setPageSize(DEFAULT_PAGE_SIZE);
            run({page: DEFAULT_PAGE, limit: DEFAULT_PAGE_SIZE});
        }
    }, [open, run]);

    const list = data?.data || [];
    const isCompactLayout = !screens.sm;

    const renderActions = (item: api.Subscribe) => {
        if (isCompactLayout) {
            return (
                <div className={'flex justify-end gap-2 w-full'}>
                    <Button
                        size={'small'}
                        icon={<SearchOutlined/>}
                        onClick={() => {
                            router.navigate({
                                to: '/home/detail',
                                search: {num: item.num}
                            });
                        }}
                    >
                        {t('subscribe:history.actions.search')}
                    </Button>
                    <Dropdown
                        trigger={['click']}
                        menu={{
                            items: [
                                {
                                    key: 'resubscribe',
                                    icon: <RollbackOutlined/>,
                                    label: t('subscribe:history.actions.resubscribe')
                                },
                                {
                                    key: 'delete',
                                    icon: <DeleteOutlined/>,
                                    danger: true,
                                    label: t('subscribe:history.actions.delete')
                                }
                            ],
                            onClick: ({key}) => {
                                if (key === 'resubscribe') {
                                    Modal.confirm({
                                        title: t('subscribe:history.confirm.resubscribe'),
                                        onOk: () => runResubscribe(item.id),
                                    });
                                }
                                if (key === 'delete') {
                                    Modal.confirm({
                                        title: t('subscribe:history.confirm.delete'),
                                        okText: t('common:actions.delete'),
                                        cancelText: t('common:actions.cancel'),
                                        okButtonProps: {danger: true},
                                        onOk: () => runDelete(item.id),
                                    });
                                }
                            }
                        }}
                    >
                        <Button
                            size={'small'}
                            icon={<MoreOutlined/>}
                        >
                            {t('subscribe:history.actions.more')}
                        </Button>
                    </Dropdown>
                </div>
            );
        }

        return (
            <Space size={6} className={'justify-end'}>
                <Button
                    size={'small'}
                    icon={<SearchOutlined/>}
                    onClick={() => {
                        router.navigate({
                            to: '/home/detail',
                            search: {num: item.num}
                        });
                    }}
                >
                    {t('subscribe:history.actions.search')}
                </Button>
                <Popconfirm
                    title={t('subscribe:history.confirm.resubscribe')}
                    okText={t('common:actions.confirm')}
                    cancelText={t('common:actions.cancel')}
                    onConfirm={() => runResubscribe(item.id)}
                >
                    <Button
                        size={'small'}
                        type={'primary'}
                        icon={<RollbackOutlined/>}
                        loading={loadingResubscribe}
                    >
                        {t('subscribe:history.actions.resubscribe')}
                    </Button>
                </Popconfirm>
                <Popconfirm
                    title={t('subscribe:history.confirm.delete')}
                    okText={t('common:actions.delete')}
                    cancelText={t('common:actions.cancel')}
                    onConfirm={() => runDelete(item.id)}
                >
                    <Button
                        size={'small'}
                        danger
                        icon={<DeleteOutlined/>}
                        loading={loadingDelete}
                    >
                        {t('subscribe:history.actions.delete')}
                    </Button>
                </Popconfirm>
            </Space>
        );
    };

    return (
            <Modal
            title={(
                <div className={'flex items-center justify-between pr-8'}>
                    <span>{t('subscribe:history.title')}</span>
                    <Tag bordered={false} color={'default'}>
                        {t('subscribe:history.total', {count: pagination.total})}
                    </Tag>
                </div>
            )}
            width={920}
            footer={null}
            open={open}
            {...otherProps}
        >
            <Spin spinning={loading}>
                {list.length > 0 ? (
                    <>
                        <List
                            itemLayout="horizontal"
                            dataSource={list}
                            renderItem={(item) => (
                                <List.Item
                                    className={'px-0 py-3'}
                                    extra={isCompactLayout ? undefined : renderActions(item)}
                                >
                                    <List.Item.Meta
                                        avatar={(
                                            <div className={'w-20 shrink-0'}>
                                                <RemoteImage src={item.cover} num={item.num} imageType={IMAGE_TYPES.COVER}/>
                                            </div>
                                        )}
                                        title={(
                                            <Typography.Text
                                                strong
                                                className={'block max-w-[360px] text-sm'}
                                                ellipsis={{tooltip: item.title || item.num}}
                                            >
                                                    {item.title || item.num}
                                            </Typography.Text>
                                        )}
                                        description={(
                                            <Space direction={'vertical'} size={4} className={'w-full'}>
                                                <Typography.Text
                                                    type={'secondary'}
                                                    className={'block max-w-[420px] text-xs'}
                                                    ellipsis={{tooltip: item.actors}}
                                                >
                                                    {item.actors || t('subscribe:history.noActors')}
                                                </Typography.Text>
                                                <Space size={[4, 4]} wrap>
                                                    {item.premiered && <Tag bordered={false} className={'text-xs'}>{String(item.premiered)}</Tag>}
                                                    {item.is_hd && <Tag color={'red'} bordered={false} className={'text-xs'}>{t('subscribe:flags.hd')}</Tag>}
                                                    {item.is_zh && <Tag color={'blue'} bordered={false} className={'text-xs'}>{t('subscribe:flags.zh')}</Tag>}
                                                    {item.is_uncensored && <Tag color={'green'} bordered={false} className={'text-xs'}>{t('subscribe:flags.uncensored')}</Tag>}
                                                </Space>
                                                <Typography.Text type={'secondary'} className={'text-xs'}>
                                                    {dayjs(item.update_time).format('YYYY-MM-DD HH:mm')}
                                                </Typography.Text>
                                                {isCompactLayout && (
                                                    <div className={'pt-2'}>
                                                        {renderActions(item)}
                                                    </div>
                                                )}
                                            </Space>
                                        )}
                                    />
                                </List.Item>
                            )}
                        />
                        <div className={'mt-4 flex justify-center'}>
                            <Pagination
                                current={pagination.current}
                                pageSize={pagination.pageSize}
                                total={pagination.total}
                                showSizeChanger
                                pageSizeOptions={PAGE_SIZE_OPTIONS}
                                onChange={(nextPage, nextPageSize) => {
                                    setPage(nextPage);
                                    setPageSize(nextPageSize);
                                    refresh(nextPage, nextPageSize);
                                }}
                            />
                        </div>
                    </>
                ) : (
                    <Empty className={'py-8'} description={t('subscribe:history.empty')}/>
                )}
            </Spin>
        </Modal>
    );
}

export default HistoryModal;
