import {Avatar, Button, Input, Typography, theme} from "antd";
import {
    SearchOutlined,
    UserOutlined,
    VideoCameraOutlined
} from "@ant-design/icons";
import React, {useEffect, useState} from "react";
import {cacheSearchHistory, clearSearchHistories, getSearchHistories} from "./history.ts";
import {useTranslation} from "react-i18next";

const {Text} = Typography;

interface SearchPanelProps {
    submittedKeyword: string;
    onSubmitActor: (keyword: string) => void;
    onSubmitVideo: (keyword: string) => void;
}

function SearchPanel(props: SearchPanelProps) {
    const {t} = useTranslation(['search']);
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
                placeholder={t('search:panel.placeholder')}
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
                        <Text strong>{t('search:panel.recent')}</Text>
                        {!!histories.length && (
                            <Button
                                type={'link'}
                                size={'small'}
                                className={'px-0'}
                                onClick={handleClearHistories}
                            >
                                {t('search:panel.clearHistory')}
                            </Button>
                        )}
                    </div>
                    <div className={'mt-3 flex flex-wrap gap-2'}>
                        {histories.length ? histories.map((item) => (
                            <Button
                                key={item}
                                type={'default'}
                                size={'small'}
                                shape={'round'}
                                title={item}
                                className={'h-auto max-w-full whitespace-normal break-all px-2 py-1 text-left'}
                                onClick={() => handlePickHistory(item)}
                            >
                                <span className={'block whitespace-normal break-all'}>{item}</span>
                            </Button>
                        )) : (
                            <Text type={'secondary'}>{t('search:empty.history')}</Text>
                        )}
                    </div>
                </div>
            )}
            {showActionPanel && (
                <div className={'mt-4'}>
                    <Text strong type={'secondary'}>{t('search:panel.chooseMode')}</Text>
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
                                <div className={'font-medium'}>{t('search:panel.searchVideo')}</div>
                                <div
                                    className={'truncate text-sm opacity-70'}>{t('search:panel.searchVideoHint', {keyword: trimmedDraftKeyword})}
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
                                <div className={'font-medium'}>{t('search:panel.searchActor')}</div>
                                <div
                                    className={'truncate text-sm opacity-70'}>{t('search:panel.searchActorHint', {keyword: trimmedDraftKeyword})}
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
