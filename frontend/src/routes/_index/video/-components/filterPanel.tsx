import {AutoComplete, Card, Input, InputNumber, Space, Tag, Typography} from "antd";
import {useEffect, useMemo, useState} from "react";
import type {VideoDetail} from "../../../../types/video";
import {
    buildAutocompleteGroups,
    decodeToken,
    encodeToken,
    formatRating,
    getTokenLabel,
    type VideoFilterValue,
    type VideoSearchToken,
} from "./filterPanel.utils.ts";

const {Text} = Typography;

const RATING_PRESETS = [3, 3.5, 4, 4.5];

interface Props {
    videos: VideoDetail[];
    total: number;
    filteredTotal: number;
    value: VideoFilterValue;
    onChange: (value: VideoFilterValue) => void;
}

function FilterPanel(props: Props) {
    const {videos, total, filteredTotal, value, onChange} = props;
    const [searchText, setSearchText] = useState("");
    const [advancedOpen, setAdvancedOpen] = useState(false);
    const [filterValue, setFilterValue] = useState<VideoFilterValue>(value);

    useEffect(() => {
        setFilterValue(value);
    }, [value]);

    useEffect(() => {
        onChange(filterValue);
    }, [filterValue, onChange]);

    const autocompleteOptions = useMemo(
        () => buildAutocompleteGroups(videos, searchText),
        [videos, searchText]
    );

    function upsertToken(token: VideoSearchToken) {
        const trimmedValue = token.value.trim();
        if (!trimmedValue) {
            return;
        }

        const normalizedToken = {...token, value: trimmedValue};
        const encoded = encodeToken(normalizedToken);
        setFilterValue((current) => {
            if (current.tokens.some((item) => encodeToken(item) === encoded)) {
                return current;
            }
            return {...current, tokens: [...current.tokens, normalizedToken]};
        });
        setSearchText("");
    }

    function removeToken(token: VideoSearchToken) {
        const encoded = encodeToken(token);
        setFilterValue((current) => ({
            ...current,
            tokens: current.tokens.filter((item) => encodeToken(item) !== encoded),
        }));
    }

    function handleSelect(value: string) {
        upsertToken(decodeToken(value));
    }

    function handleSearchConfirm() {
        const nextValue = searchText.trim();
        if (!nextValue) {
            return;
        }

        upsertToken({kind: "title", value: nextValue});
    }

    function clearFilters() {
        setSearchText("");
        setFilterValue({
            tokens: [],
            isZh: false,
            isUncensored: false,
            minRating: null,
        });
    }

    const activeFilterTags = useMemo(() => {
        const tags = filterValue.tokens.map((token) => ({
            key: encodeToken(token),
            label: getTokenLabel(token),
            onClose: () => removeToken(token),
        }));

        if (filterValue.isZh) {
            tags.push({
                key: "switch:zh",
                label: "中文",
                onClose: () => setFilterValue((current) => ({...current, isZh: false})),
            });
        }

        if (filterValue.isUncensored) {
            tags.push({
                key: "switch:uncensored",
                label: "无码",
                onClose: () => setFilterValue((current) => ({...current, isUncensored: false})),
            });
        }

        if (filterValue.minRating !== null) {
            tags.push({
                key: "rating",
                label: `评分: ${formatRating(filterValue.minRating)}+`,
                onClose: () => setFilterValue((current) => ({...current, minRating: null})),
            });
        }

        return tags;
    }, [filterValue]);

    return (
        <Card className={'mb-4'}>
            <div className={'flex flex-wrap items-center justify-between gap-3'}>
                <div className={'text-lg font-medium'}>影片库</div>
                <Text type={'secondary'}>{filteredTotal} / {total}</Text>
            </div>

            <div className={'mt-4 flex flex-col gap-3'}>
                <AutoComplete
                    value={searchText}
                    options={autocompleteOptions as never}
                    onSearch={setSearchText}
                    onSelect={handleSelect}
                >
                    <Input
                        allowClear
                        placeholder={'搜索番号、演员，或输入标题后回车'}
                        value={searchText}
                        onChange={(event) => setSearchText(event.target.value)}
                        onPressEnter={handleSearchConfirm}
                    />
                </AutoComplete>

                <div className={'flex flex-wrap items-center gap-2'}>
                    <Tag.CheckableTag
                        checked={filterValue.isZh}
                        onChange={(checked) => setFilterValue((current) => ({...current, isZh: checked}))}
                    >
                        中文
                    </Tag.CheckableTag>
                    <Tag.CheckableTag
                        checked={filterValue.isUncensored}
                        onChange={(checked) => setFilterValue((current) => ({...current, isUncensored: checked}))}
                    >
                        无码
                    </Tag.CheckableTag>
                    <Tag.CheckableTag checked={advancedOpen} onChange={setAdvancedOpen}>更多筛选</Tag.CheckableTag>
                    {activeFilterTags.length > 0 && (
                        <a onClick={clearFilters}>清空条件</a>
                    )}
                </div>

                {advancedOpen && (
                    <div className={'flex flex-wrap items-center gap-3 rounded-lg border border-solid border-gray-200 px-3 py-2'}>
                        <Text strong>评分</Text>
                        <InputNumber
                            min={0}
                            max={5}
                            step={0.1}
                            value={filterValue.minRating ?? undefined}
                            placeholder={'不限'}
                            onChange={(value) => {
                                if (typeof value !== "number" || value <= 0) {
                                    setFilterValue((current) => ({...current, minRating: null}));
                                    return;
                                }
                                setFilterValue((current) => ({...current, minRating: value}));
                            }}
                        />
                        <Space size={[8, 8]} wrap>
                            {RATING_PRESETS.map((value) => (
                                <Tag.CheckableTag
                                    key={value}
                                    checked={filterValue.minRating === value}
                                    onChange={(checked) => setFilterValue((current) => ({
                                        ...current,
                                        minRating: checked ? value : null,
                                    }))}
                                >
                                    {value.toFixed(1)}+
                                </Tag.CheckableTag>
                            ))}
                        </Space>
                    </div>
                )}

                {activeFilterTags.length > 0 && (
                    <div className={'flex flex-wrap items-center gap-2'}>
                        <Text type={'secondary'}>当前条件</Text>
                        <Space size={[8, 8]} wrap>
                            {activeFilterTags.map((item) => (
                                <Tag key={item.key} closable onClose={item.onClose}>
                                    {item.label}
                                </Tag>
                            ))}
                        </Space>
                    </div>
                )}
            </div>
        </Card>
    );
}

export default FilterPanel;
