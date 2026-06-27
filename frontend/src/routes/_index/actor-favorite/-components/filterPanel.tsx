import {AutoComplete, Card, Input, Space, Tag, Typography} from "antd";
import {useDeferredValue, useEffect, useMemo, useState} from "react";
import type {ActorFavorite} from "../../../../types/actor.ts";
import {
    buildAutocompleteGroups,
    decodeToken,
    encodeToken,
    getTokenLabel,
    type ActorFavoriteFilterValue,
    type ActorFavoriteSearchToken,
} from "./filterPanel.utils.ts";

const {Text} = Typography;

interface Props {
    favorites: ActorFavorite[];
    total: number;
    filteredTotal: number;
    value: ActorFavoriteFilterValue;
    onChange: (value: ActorFavoriteFilterValue) => void;
}

function FilterPanel(props: Props) {
    const {favorites, total, filteredTotal, value, onChange} = props;
    const [searchText, setSearchText] = useState("");
    const [filterValue, setFilterValue] = useState<ActorFavoriteFilterValue>(value);
    const deferredSearchText = useDeferredValue(searchText);

    useEffect(() => {
        setFilterValue(value);
    }, [value]);

    useEffect(() => {
        onChange(filterValue);
    }, [filterValue, onChange]);

    const autocompleteOptions = useMemo(
        () => buildAutocompleteGroups(favorites, deferredSearchText),
        [deferredSearchText, favorites]
    );

    function upsertToken(token: ActorFavoriteSearchToken) {
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

    function removeToken(token: ActorFavoriteSearchToken) {
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

        upsertToken({kind: "name", value: nextValue});
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
                <div className={'text-lg font-medium'}>演员收藏</div>
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
                        placeholder={'搜索演员名称、别名，或输入名称后回车'}
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
