import {AutoComplete, Card, Input, Space, Tag, Typography} from "antd";
import {useDeferredValue, useEffect, useMemo, useState} from "react";
import type {ActorFavorite} from "../../../../types/actor.ts";
import {useTranslation} from "react-i18next";
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
    const {t} = useTranslation(['actor']);
    const {favorites, total, filteredTotal, value, onChange} = props;
    const [searchText, setSearchText] = useState("");
    const [filterValue, setFilterValue] = useState<ActorFavoriteFilterValue>(value);
    const deferredSearchText = useDeferredValue(searchText);
    const texts = useMemo(() => ({
        actorLabel: t('actor:favorite.token.actor'),
        aliasLabel: t('actor:favorite.token.alias'),
    }), [t]);

    useEffect(() => {
        setFilterValue(value);
    }, [value]);

    useEffect(() => {
        onChange(filterValue);
    }, [filterValue, onChange]);

    const autocompleteOptions = useMemo(
        () => buildAutocompleteGroups(favorites, deferredSearchText, texts),
        [deferredSearchText, favorites, texts]
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
            label: getTokenLabel(token, texts),
            onClose: () => removeToken(token),
        }));
    }, [filterValue.tokens, texts]);

    return (
        <Card className={'mb-4'}>
            <div className={'flex flex-wrap items-center justify-between gap-3'}>
                <div className={'text-lg font-medium'}>{t('actor:favorite.pageTitle')}</div>
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
                        placeholder={t('actor:favorite.searchPlaceholder')}
                        value={searchText}
                        onChange={(event) => setSearchText(event.target.value)}
                        onPressEnter={handleSearchConfirm}
                    />
                </AutoComplete>

                {activeFilterTags.length > 0 && (
                    <div className={'flex flex-wrap items-center gap-2'}>
                        <Text type={'secondary'}>{t('actor:favorite.currentFilters')}</Text>
                        <Space size={[8, 8]} wrap>
                            {activeFilterTags.map((item) => (
                                <Tag key={item.key} closable onClose={item.onClose}>
                                    {item.label}
                                </Tag>
                            ))}
                        </Space>
                        <a onClick={clearFilters}>{t('actor:favorite.clearFilters')}</a>
                    </div>
                )}
            </div>
        </Card>
    );
}

export default FilterPanel;
