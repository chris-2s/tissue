import {AutoComplete, Card, Input, InputNumber, Space, Tag, Typography} from "antd";
import {useDeferredValue, useEffect, useMemo, useState} from "react";
import type {VideoDetail} from "../../../../types/video";
import {
    buildAutocompleteGroups,
    cycleFlagFilter,
    decodeToken,
    encodeToken,
    formatRating,
    getFlagFilterLabel,
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
    const deferredSearchText = useDeferredValue(searchText);

    useEffect(() => {
        setFilterValue(value);
    }, [value]);

    useEffect(() => {
        onChange(filterValue);
    }, [filterValue, onChange]);

    const autocompleteOptions = useMemo(
        () => buildAutocompleteGroups(videos, deferredSearchText),
        [deferredSearchText, videos]
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
            zh: null,
            uncensored: null,
            ratingOperator: "gte",
            ratingValue: null,
        });
    }

    const activeFilterTags = useMemo(() => {
        const tags = filterValue.tokens.map((token) => ({
            key: encodeToken(token),
            label: getTokenLabel(token),
            onClose: () => removeToken(token),
        }));

        if (filterValue.zh !== null) {
            tags.push({
                key: "switch:zh",
                label: getFlagFilterLabel("中文", filterValue.zh),
                onClose: () => setFilterValue((current) => ({...current, zh: null})),
            });
        }

        if (filterValue.uncensored !== null) {
            tags.push({
                key: "switch:uncensored",
                label: getFlagFilterLabel("无码", filterValue.uncensored),
                onClose: () => setFilterValue((current) => ({...current, uncensored: null})),
            });
        }

        if (filterValue.ratingValue !== null) {
            tags.push({
                key: "rating",
                label: `评分 ${filterValue.ratingOperator === "gte" ? ">=" : "<="} ${formatRating(filterValue.ratingValue)}`,
                onClose: () => setFilterValue((current) => ({...current, ratingValue: null})),
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
                        checked={filterValue.zh !== null}
                        onChange={() => setFilterValue((current) => ({
                            ...current,
                            zh: cycleFlagFilter(current.zh),
                        }))}
                    >
                        {getFlagFilterLabel("中文", filterValue.zh)}
                    </Tag.CheckableTag>
                    <Tag.CheckableTag
                        checked={filterValue.uncensored !== null}
                        onChange={() => setFilterValue((current) => ({
                            ...current,
                            uncensored: cycleFlagFilter(current.uncensored),
                        }))}
                    >
                        {getFlagFilterLabel("无码", filterValue.uncensored)}
                    </Tag.CheckableTag>
                    <Tag.CheckableTag checked={advancedOpen} onChange={setAdvancedOpen}>更多筛选</Tag.CheckableTag>
                    {activeFilterTags.length > 0 && (
                        <a onClick={clearFilters}>清空条件</a>
                    )}
                </div>

                {advancedOpen && (
                    <div className={'flex flex-wrap items-center gap-3 rounded-lg border border-solid border-gray-200 px-3 py-2'}>
                        <Text strong>评分</Text>
                        <Space size={[8, 8]} wrap>
                            <Tag.CheckableTag
                                checked={filterValue.ratingOperator === "gte"}
                                onChange={() => setFilterValue((current) => ({...current, ratingOperator: "gte"}))}
                            >
                                {">="}
                            </Tag.CheckableTag>
                            <Tag.CheckableTag
                                checked={filterValue.ratingOperator === "lte"}
                                onChange={() => setFilterValue((current) => ({...current, ratingOperator: "lte"}))}
                            >
                                {"<="}
                            </Tag.CheckableTag>
                        </Space>
                        <InputNumber
                            min={0}
                            max={5}
                            step={0.1}
                            variant={'borderless'}
                            value={filterValue.ratingValue ?? undefined}
                            placeholder={'不限'}
                            style={{width: 96}}
                            onChange={(value) => {
                                if (typeof value !== "number" || value <= 0) {
                                    setFilterValue((current) => ({...current, ratingValue: null}));
                                    return;
                                }
                                setFilterValue((current) => ({...current, ratingValue: value}));
                            }}
                        />
                        <Space size={[8, 8]} wrap>
                            {RATING_PRESETS.map((value) => (
                                <Tag.CheckableTag
                                    key={value}
                                    checked={filterValue.ratingValue === value}
                                    onChange={(checked) => setFilterValue((current) => ({
                                        ...current,
                                        ratingValue: checked ? value : null,
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
