import {AutoComplete, Card, Input, Space, Tag, Typography} from "antd";
import {useDeferredValue, useEffect, useMemo, useState} from "react";
import {useTranslation} from "react-i18next";
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
    const {t} = useTranslation(['subscribe']);
    const {subscribes, total, filteredTotal, value, onChange} = props;
    const [searchText, setSearchText] = useState("");
    const [filterValue, setFilterValue] = useState<SubscribeFilterValue>(value);
    const deferredSearchText = useDeferredValue(searchText);
    const texts = useMemo(() => ({
        numLabel: t('subscribe:filter.token.num'),
        actorLabel: t('subscribe:filter.token.actor'),
        titleLabel: t('subscribe:filter.token.title'),
    }), [t]);

    useEffect(() => {
        setFilterValue(value);
    }, [value]);

    useEffect(() => {
        onChange(filterValue);
    }, [filterValue, onChange]);

    const autocompleteOptions = useMemo(
        () => buildAutocompleteGroups(subscribes, deferredSearchText, texts),
        [deferredSearchText, subscribes, texts]
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
            label: getTokenLabel(token, texts),
            onClose: () => removeToken(token),
        }));
    }, [filterValue.tokens, texts]);

    return (
        <Card className={'mb-4'}>
            <div className={'flex flex-wrap items-center justify-between gap-3'}>
                <div className={'text-lg font-medium'}>{t('subscribe:pageTitle')}</div>
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
                        placeholder={t('subscribe:filter.searchPlaceholder')}
                        value={searchText}
                        onChange={(event) => setSearchText(event.target.value)}
                        onPressEnter={handleSearchConfirm}
                    />
                </AutoComplete>

                {activeFilterTags.length > 0 && (
                    <div className={'flex flex-wrap items-center gap-2'}>
                        <Text type={'secondary'}>{t('subscribe:filter.currentFilters')}</Text>
                        <Space size={[8, 8]} wrap>
                            {activeFilterTags.map((item) => (
                                <Tag key={item.key} closable onClose={item.onClose}>
                                    {item.label}
                                </Tag>
                            ))}
                        </Space>
                        <a onClick={clearFilters}>{t('subscribe:filter.clearFilters')}</a>
                    </div>
                )}
            </div>
        </Card>
    );
}

export default FilterPanel;
