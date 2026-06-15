import {Avatar, Button, Input, Typography, theme} from "antd";
import type {InputRef} from "antd";
import {
    HistoryOutlined,
    SearchOutlined,
    UserOutlined,
    VideoCameraOutlined
} from "@ant-design/icons";
import React from "react";

const {Text} = Typography;

interface SearchPanelProps {
    draftKeyword: string;
    histories: string[];
    isActive: boolean;
    inputRef: React.Ref<InputRef>;
    onChangeKeyword: (value: string) => void;
    onBlurInput: () => void;
    onClearHistories: () => void;
    onFocusInput: () => void;
    onPickHistory: (keyword: string) => void;
    onSearchActor: () => void;
    onSearchVideo: () => void;
}

function SearchPanel(props: SearchPanelProps) {
    const {
        draftKeyword,
        histories,
        isActive,
        inputRef,
        onChangeKeyword,
        onBlurInput,
        onClearHistories,
        onFocusInput,
        onPickHistory,
        onSearchActor,
        onSearchVideo
    } = props;
    const {token} = theme.useToken();

    const trimmedDraftKeyword = draftKeyword.trim();
    const showHistoryPanel = isActive && !trimmedDraftKeyword;
    const showActionPanel = isActive && !!trimmedDraftKeyword;

    return (
        <div>
            <Input.Search
                ref={inputRef}
                className={'flex-1'}
                placeholder={'搜索电影、剧集以及更多...'}
                enterButton
                allowClear
                value={draftKeyword}
                onFocus={onFocusInput}
                onBlur={onBlurInput}
                onChange={(event) => onChangeKeyword(event.target.value)}
                onSearch={onSearchVideo}
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
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={onClearHistories}
                            >
                                清空历史
                            </Button>
                        )}
                    </div>
                    <div className={'mt-3 flex flex-wrap gap-2'}>
                        {histories.length ? histories.map((item) => (
                            <Button
                                key={item}
                                type={'default'}
                                shape={'round'}
                                icon={<HistoryOutlined/>}
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => onPickHistory(item)}
                            >
                                {item}
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
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={onSearchVideo}
                        >
                            <Avatar icon={<VideoCameraOutlined/>} style={{background: token.colorPrimary}}/>
                            <div className={'flex-1 overflow-hidden'}>
                                <div className={'font-medium'}>搜索影片</div>
                                <div className={'truncate text-sm opacity-70'}>搜索 {trimmedDraftKeyword} 相关的影片结果</div>
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
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={onSearchActor}
                        >
                            <Avatar icon={<UserOutlined/>} style={{background: token.colorPrimary}}/>
                            <div className={'flex-1 overflow-hidden'}>
                                <div className={'font-medium'}>搜索演员</div>
                                <div className={'truncate text-sm opacity-70'}>搜索 {trimmedDraftKeyword} 相关的演员结果</div>
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
