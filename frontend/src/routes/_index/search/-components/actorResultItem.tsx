import {List, Tag} from "antd";
import React from "react";
import RemoteImage from "../../../../components/RemoteImage";
import {IMAGE_TYPES} from "../../../../constants/image";
import type {ActorCandidate} from "./types";

interface ActorResultItemProps {
    item: ActorCandidate;
    onClick: () => void;
}

function ActorResultItem(props: ActorResultItemProps) {
    const {item, onClick} = props;

    return (
        <List.Item className={'cursor-pointer'} onClick={onClick}>
            <List.Item.Meta
                avatar={(
                    <div className={'h-14 w-14 bg-black/5'}>
                        <RemoteImage className={'h-full w-full'} src={item.thumb} num={item.code} avatar imageType={IMAGE_TYPES.AVATAR}/>
                    </div>
                )}
                title={item.name}
                description={item.site_name ? <Tag variant={'filled'}>{item.site_name}</Tag> : undefined}
            />
        </List.Item>
    );
}

export default ActorResultItem;
