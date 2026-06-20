import {Avatar, List, Tag} from "antd";
import {UserOutlined} from "@ant-design/icons";
import React from "react";
import {LazyLoadImage} from "react-lazy-load-image-component";
import * as videoApi from "../../../../apis/video.ts";
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
                avatar={item.thumb ? (
                    <div className={'h-14 w-14 overflow-hidden rounded-full bg-black/5'}>
                        <LazyLoadImage className={'h-full w-full object-contain'} src={videoApi.getVideoCover(item.thumb)}/>
                    </div>
                ) : (
                    <Avatar size={56} icon={<UserOutlined/>}>
                        {item.name.slice(0, 1).toUpperCase()}
                    </Avatar>
                )}
                title={item.name}
                description={item.site_name ? <Tag variant={'filled'}>{item.site_name}</Tag> : undefined}
            />
        </List.Item>
    );
}

export default ActorResultItem;
