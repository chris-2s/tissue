import {AutoComplete, Card, Input, Space, Tag, Typography} from "antd";
import {useEffect, useMemo, useState} from "react";
import type {Subscribe} from "../../../../apis/subscribe.ts";
import {
    buildAutocompleteGroups,
    decodeToken,
    encodeToken,
    getTokenLabel,
    type SubscribeFilterValue,
    type SubscribeSearchToken,
} from "./filterPanel.utils.ts";

const {Text} = Typography;

interface Props {
    subscribes: Subscribe[];
    total: number;
    filteredTotal: number;
    value: SubscribeFilterValue;
    onChange: (value: SubscribeFilterValue) => void;
}

function FilterPanel(props: Props) {
    const {subscribes, total, filteredTotal, value, onChange} = props;
    const [searchText, setSearchText] = useState("");
    const [filterValue, setFilterValue] = useState<SubscribeFilterValue>(value);

    useEffect(() => {
        setFilterValue(value);
    }, [value]);

    useEffect(() => {
        onChange(filterValue);
    }, [filterValue, onChange]);

    const autocompleteOptions = useMemo(
        () => buildAutocompleteGroups(subscribes, searchText),
        [subscribes, searchText]
    );

    function upsertToken(token: SubscribeSearchToken) {
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

    function removeToken(token: SubscribeSearchToken) {
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
        setFilterValue({tokens: []});
    }

    const activeFilterTags = useMemo(() => {
        return filterValue.tokens.map((token) => ({
            key: encodeToken(token),
            label: getTokenLabel(token),
            onClose: () => removeToken(token),
        }));
    }, [filterValue.tokens]);

    return (
        <Card className={'mb-4'}>
            <div className={'flex flex-wrap items-center justify-between gap-3'}>
                <div className={'text-lg font-medium'}>订阅</div>
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
                        <a onClick={clearFilters}>清空条件</a>
                    </div>
                )}
            </div>
        </Card>
    );
}

export default FilterPanel;
