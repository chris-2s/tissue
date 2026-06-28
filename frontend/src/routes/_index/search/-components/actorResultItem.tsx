import {List} from "antd";
import React from "react";
import {useTranslation} from "react-i18next";
import RemoteImage from "../../../../components/RemoteImage";
import {IMAGE_TYPES} from "../../../../constants/image";
import type {ActorCandidate} from "./types";

interface ActorResultItemProps {
    item: ActorCandidate;
    onClick: () => void;
}

function ActorResultItem(props: ActorResultItemProps) {
    const {t} = useTranslation(['search']);
    const {item, onClick} = props;

    return (
        <List.Item className={'cursor-pointer'} onClick={onClick}>
            <List.Item.Meta
                avatar={(
                    <div className={'h-14 w-14'}>
                        <RemoteImage className={'h-full w-full'} src={item.thumb} num={item.code} avatar
                                     imageType={IMAGE_TYPES.AVATAR}/>
                    </div>
                )}
                title={item.name}
                description={(item.alias && item.alias.length > 0) ? (
                    <div>{t('search:actorResults.aliasLabel')}: {item.alias.join("，")}</div>
                ) : (
                    <div>{t('search:actorResults.noAlias')}</div>
                )}
            />
        </List.Item>
    );
}

export default ActorResultItem;
