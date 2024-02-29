import {useEffect, useRef, useState} from "react";
import {useSelector} from "react-redux";
import {RootState} from "../../models";
import configs from "../../configs";
import {fetchEventSource} from "@microsoft/fetch-event-source";
import {Table, Tag} from "antd";
import {ColumnsType} from "antd/lib/table";

interface Message {
    index: number
    level: string,
    module: string,
    time: string
    content: string
}

const tagColorMap: { [key: string]: string } = {
    'INFO': 'default',
    'WARN': 'warning',
    'ERROR': 'error',
}

function Log() {

    const {userToken} = useSelector((state: RootState) => state.auth)
    const [messages, setMessages] = useState<Message[]>([])
    const container = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const ctrl = new AbortController();
        fetchEventSource(`${configs.BASE_API}/home/log`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${userToken}`
            },
            signal: ctrl.signal,
            openWhenHidden: true,
            onmessage(msg) {
                if (msg.data) {
                    const matched = msg.data.match(/【(.+)】(.+) - (.+) - (.+)/)
                    if (matched) {
                        setMessages(data => [...data, {
                            index: data.length + 1,
                            level: matched[1],
                            module: matched[2],
                            time: matched[3],
                            content: matched[4],
                        }])
                    }
                }
            },
        });
        return () => {
            ctrl.abort()
        }
    }, [])

    useEffect(() => {
        container.current?.scrollTo({
            top: 99999999,
            behavior: "smooth"
        })
    }, [messages]);

    const columns: ColumnsType<any> = [
        {
            dataIndex: 'level',
            width: 80,
            render: (value) => (<Tag color={tagColorMap[value]}>{value}</Tag>)
        },
        {
            dataIndex: 'time',
            width: 80
        },
        {
            dataIndex: 'module',
            width: 220
        },
        {
            dataIndex: 'content',
            width: 600
        }
    ]

    return (
        <div ref={container} style={{height: '85vh', overflowY: 'scroll'}}>
            <Table rowKey={'index'} showHeader={false} columns={columns} dataSource={messages} pagination={false}
                   scroll={{x: 'max-content'}}/>
        </div>
    )
}

export default Log
