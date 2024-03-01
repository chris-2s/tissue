import {Avatar, message, Tooltip} from "antd";
import * as api from "../../apis/video";
import React, {useState} from "react";
import ModifyModal from "./modifyModal";

interface Actor {
    name: string
    thumb?: string
}

interface Props {
    value?: Actor[]
    onChange?: (value?: Actor[]) => void
}

function VideoActors(props: Props) {

    const {value, onChange} = props
    const [editMode, setEditMode] = useState<string | undefined>(undefined)
    const [selected, setSelected] = useState<number | undefined>(undefined)

    function onSave(data: any) {
        if (editMode === 'add') {
            if (value?.some((i) => i.name === data.name)) {
                return message.error("该演员已存在")
            }
            onChange?.([...(value || []), data])
        } else if (editMode == 'edit') {
            value!![selected!!] = data
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
                            <Avatar style={{cursor: 'pointer'}}
                                    size={"large"}
                                    src={actor?.thumb && api.getVideoCover(actor.thumb)}
                                    onClick={() => {
                                        setEditMode('edit')
                                        setSelected(index)
                                    }}
                            />
                        </Tooltip>
                    ))}
                    <Tooltip title={'新增'}>
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
