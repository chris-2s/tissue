import {Avatar, Button, Input, Typography, theme} from "antd";
import {
    HistoryOutlined,
    SearchOutlined,
    UserOutlined,
    VideoCameraOutlined
} from "@ant-design/icons";
import React, {useEffect, useState} from "react";
import {cacheSearchHistory, clearSearchHistories, getSearchHistories} from "./history.ts";

const {Text} = Typography;

interface SearchPanelProps {
    submittedKeyword: string;
    onSubmitActor: (keyword: string) => void;
    onSubmitVideo: (keyword: string) => void;
}

function SearchPanel(props: SearchPanelProps) {
    const {submittedKeyword, onSubmitActor, onSubmitVideo} = props;
    const {token} = theme.useToken();
    const [draftKeyword, setDraftKeyword] = useState(submittedKeyword);
    const [showSearchActions, setShowSearchActions] = useState(false);
    const [histories, setHistories] = useState<string[]>([]);

    useEffect(() => {
        setDraftKeyword(submittedKeyword);
        setShowSearchActions(false);
    }, [submittedKeyword]);

    useEffect(() => {
        setHistories(getSearchHistories());
    }, []);

    const trimmedDraftKeyword = draftKeyword.trim();
    const showHistoryPanel = !trimmedDraftKeyword;
    const showActionPanel = showSearchActions && !!trimmedDraftKeyword;

    function handleChangeKeyword(value: string) {
        setDraftKeyword(value);
        setShowSearchActions(!!value.trim());
    }

    function handleClearHistories() {
        clearSearchHistories();
        setHistories([]);
    }

    function handlePickHistory(keyword: string) {
        setDraftKeyword(keyword);
        setShowSearchActions(true);
    }

    function recordHistory(keyword: string) {
        cacheSearchHistory(keyword);
        setHistories(getSearchHistories());
    }

    function handleSubmitVideo(keyword?: string) {
        if (!trimmedDraftKeyword || !keyword) {
            return;
        }
        recordHistory(trimmedDraftKeyword);
        setShowSearchActions(false);
        onSubmitVideo(trimmedDraftKeyword);
    }

    function handleSubmitActor() {
        if (!trimmedDraftKeyword) {
            return;
        }
        recordHistory(trimmedDraftKeyword);
        setShowSearchActions(false);
        onSubmitActor(trimmedDraftKeyword);
    }

    return (
        <div>
            <Input.Search
                className={'flex-1'}
                placeholder={'搜索电影、剧集以及更多...'}
                enterButton
                allowClear
                value={draftKeyword}
                onChange={(event) => handleChangeKeyword(event.target.value)}
                onSearch={handleSubmitVideo}
                onFocus={() => draftKeyword && setShowSearchActions(true)}
            />
            {showHistoryPanel && (
                <div className={'mt-4'}>
                    <div className={'flex items-center justify-between gap-3'}>
                        <Text strong>最近搜索</Text>
                        {!!histories.length && (
                            <Button
                                type={'link'}
                                size={'small'}
                                className={'px-0'}
                                onClick={handleClearHistories}
                            >
                                清空历史
                            </Button>
                        )}
                    </div>
                    <div className={'mt-3 grid grid-cols-3 gap-2 sm:flex sm:flex-wrap'}>
                        {histories.length ? histories.map((item) => (
                            <Button
                                key={item}
                                type={'default'}
                                size={'small'}
                                shape={'round'}
                                icon={<HistoryOutlined/>}
                                title={item}
                                className={'w-full min-w-0 px-2 sm:w-auto sm:max-w-full'}
                                onClick={() => handlePickHistory(item)}
                            >
                                <span className={'block truncate'}>{item}</span>
                            </Button>
                        )) : (
                            <Text type={'secondary'}>暂无历史记录</Text>
                        )}
                    </div>
                </div>
            )}
            {showActionPanel && (
                <div className={'mt-4'}>
                    <Text strong type={'secondary'}>选择搜索方式</Text>
                    <div className={'mt-3 grid gap-2'}>
                        <button
                            type={'button'}
                            className={'flex w-full cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors hover:bg-black/5'}
                            style={{
                                background: token.colorFillQuaternary,
                                borderColor: token.colorBorderSecondary
                            }}
                            onClick={() => handleSubmitVideo(trimmedDraftKeyword)}
                        >
                            <Avatar icon={<VideoCameraOutlined/>} style={{background: token.colorPrimary}}/>
                            <div className={'flex-1 overflow-hidden'}>
                                <div className={'font-medium'}>搜索影片</div>
                                <div
                                    className={'truncate text-sm opacity-70'}>搜索 {trimmedDraftKeyword} 相关的影片结果
                                </div>
                            </div>
                            <SearchOutlined/>
                        </button>
                        <button
                            type={'button'}
                            className={'flex w-full cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors hover:bg-black/5'}
                            style={{
                                background: token.colorFillQuaternary,
                                borderColor: token.colorBorderSecondary
                            }}
                            onClick={handleSubmitActor}
                        >
                            <Avatar icon={<UserOutlined/>} style={{background: token.colorPrimary}}/>
                            <div className={'flex-1 overflow-hidden'}>
                                <div className={'font-medium'}>搜索演员</div>
                                <div
                                    className={'truncate text-sm opacity-70'}>搜索 {trimmedDraftKeyword} 相关的演员结果
                                </div>
                            </div>
                            <SearchOutlined/>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SearchPanel;
