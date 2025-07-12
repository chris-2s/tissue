import {createFileRoute} from "@tanstack/react-router";
import {Badge, Card, List, Space, Tag, theme} from "antd";
import ModifyModal from "./-components/modifyModal.tsx";
import {useFormModal} from "../../../utils/useFormModal.ts";
import * as api from "../../../apis/site.ts";
import {useRequest} from "ahooks";


export const Route = createFileRoute('/_index/site/')({
    component: Site
})

function Site() {

    const {token} = theme.useToken()

    const {data, refresh} = useRequest(api.getSites, {})

    const {modalProps, setOpen} = useFormModal({
        service: api.modifySite,
        onOk: () => {
            setOpen(false)
            refresh()
        }
    })

    function renderItem(item: any) {
        return (
            <List.Item>
                <Badge.Ribbon text={item.status ? '启用' : '停用'}
                              color={item.status ? token.colorPrimary : token.colorTextDisabled}>
                    <Card size={'default'}
                          title={item.name}
                          className={'cursor-pointer'}
                          onClick={() => setOpen(true, item)}
                    >
                        <Space direction={"vertical"} size={'large'}>
                            <div>
                                {item.host}
                            </div>
                            <div>
                                <Tag color={'blue'}>元数据</Tag>
                                <Tag color={'green'}>下载</Tag>
                            </div>
                        </Space>
                    </Card>
                </Badge.Ribbon>
            </List.Item>
        )
    }

    return (
        <>
            <List grid={{gutter: 16, xxl: 4, xl: 4, lg: 4, md: 2, xs: 1}}
                  dataSource={data}
                  renderItem={renderItem}/>
            <ModifyModal {...modalProps} />
        </>
    )
}
