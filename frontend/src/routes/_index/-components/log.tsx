import {useEffect, useRef, useState} from "react";
import {useSelector} from "react-redux";
import {RootState} from "../../../models";
import configs from "../../../configs";
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
                        setMessages(data => [{
                            index: data.length + 1,
                            level: matched[1],
                            time: matched[2].split(" ")[1],
                            module: matched[3],
                            content: matched[4],
                        }, ...data])
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
            top: 0,
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
            width: 100
        },
        {
            dataIndex: 'module',
            width: 80
        },
        {
            dataIndex: 'content',
            width: 600
        }
    ]

    return (
        <div ref={container} style={{height: '80vh', overflowY: 'auto'}}>
            <Table rowKey={'index'} showHeader={false} columns={columns} dataSource={messages} pagination={false}
                   scroll={{x: 'max-content'}}/>
        </div>
    )
}

export default Log
