import React, {useEffect, useRef, useState} from "react";
import {Input, InputRef, Space, Tag, theme} from "antd";
import {PlusOutlined} from "@ant-design/icons";

interface Props {
    value?: string[],
    onChange?: (value?: string[]) => void
    readonly?: boolean
}


function Websites(props: Props) {
    const {token} = theme.useToken();
    const tagInputStyle: React.CSSProperties = {
        width: 64,
        height: 22,
        marginInlineEnd: 8,
        verticalAlign: 'top',
    };

    const tagPlusStyle: React.CSSProperties = {
        height: 22,
        background: token.colorBgContainer,
        borderStyle: 'dashed',
    };

    const {value, onChange, readonly = false} = props
    const inputRef = useRef<InputRef>(null);
    const [inputVisible, setInputVisible] = useState(false);
    const [editInputValue, setEditInputValue] = useState('');

    useEffect(() => {
        if (inputVisible) {
            inputRef.current?.focus();
        }
    }, [inputVisible])

    const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEditInputValue(e.target.value);
    };

    const handleEditInputConfirm = () => {
        try {
            new URL(editInputValue)
            const newValue = [...(value || []), editInputValue];
            onChange?.(newValue);
            setEditInputValue('');
        } catch (e) {
            setEditInputValue('')
            setInputVisible(false)
        }
    };

    const handleClose = (removedTag: string) => {
        const newValue = value?.filter((tag) => tag !== removedTag);
        onChange?.(newValue);
    };

    function handleURL(url: string) {
        return new URL(url).hostname
    }

    return (
        <Space size={[0, 8]} wrap>
            <>
                {value?.map((tag, index) => (
                    <Tag key={tag}
                         closable={!readonly}
                         style={{userSelect: 'none'}}
                         onClose={() => handleClose(tag)}
                         onClick={() => window.open(tag)}
                    >
                        <span style={{cursor: 'pointer'}}>{handleURL(tag)}</span>
                    </Tag>
                ))}
                {inputVisible ? (
                    <Input ref={inputRef}
                           size="small"
                           style={tagInputStyle}
                           value={editInputValue}
                           onChange={handleEditInputChange}
                           onBlur={handleEditInputConfirm}
                           onPressEnter={handleEditInputConfirm}
                    />
                ) : (
                    !readonly && (
                        <Tag style={tagPlusStyle} icon={<PlusOutlined/>} onClick={() => setInputVisible(true)}>
                            新增
                        </Tag>
                    )
                )}
            </>
        </Space>
    )
}

export default Websites
