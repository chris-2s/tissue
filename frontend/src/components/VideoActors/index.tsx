import {Avatar, message, Tooltip} from "antd";
import React, {useState} from "react";
import {useTranslation} from "react-i18next";
import ModifyModal from "./modifyModal";
import RemoteImage from "../RemoteImage";
import {IMAGE_TYPES} from "../../constants/image";

interface Actor {
    name: string
    thumb?: string
}

interface Props {
    value?: Actor[]
    onChange?: (value?: Actor[]) => void
}

function VideoActors(props: Props) {

    const {t} = useTranslation(['video'])
    const {value, onChange} = props
    const [editMode, setEditMode] = useState<string | undefined>(undefined)
    const [selected, setSelected] = useState<number | undefined>(undefined)

    function onSave(data: any) {
        if (editMode === 'add') {
            if (value?.some((i) => i.name === data.name)) {
                return message.error(t('video:detail.messages.actorExists'))
            }
            onChange?.([...(value || []), data])
        } else if (editMode == 'edit' && value && selected !== undefined) {
            value[selected] = data
            onChange?.(value && [...value])
        }
        setEditMode(undefined)
        setSelected(undefined)
    }

    function onDelete() {
        onChange?.(value?.filter((_, index) => index != selected))
        setEditMode(undefined)
        setSelected(undefined)
    }

    return (
        <>
            <div style={{display: "flex", marginBottom: 5}}>
                <Avatar.Group maxCount={8}>
                    {value?.map((actor: any, index: number) => (
                        <Tooltip title={actor?.name} key={actor.name}>
                            <div
                                className={'h-10 w-10 cursor-pointer'}
                                onClick={() => {
                                    setEditMode('edit')
                                    setSelected(index)
                                }}
                            >
                                <RemoteImage
                                    className={'h-full w-full'}
                                    src={actor?.thumb}
                                    avatar
                                    imageType={IMAGE_TYPES.AVATAR}
                                />
                            </div>
                        </Tooltip>
                    ))}
                    <Tooltip title={t('video:detail.actions.addActor')}>
                        <Avatar style={{cursor: 'pointer'}} size={"large"} onClick={() => {
                            setEditMode('add')
                            setSelected(undefined)
                        }}>+</Avatar>
                    </Tooltip>
                </Avatar.Group>
            </div>
            <ModifyModal data={(selected != undefined && value) && value[selected]}
                         open={!!editMode}
                         onOk={onSave}
                         onCancel={() => setEditMode(undefined)}
                         onDelete={onDelete}
            />
        </>
    )
}

export default VideoActors
