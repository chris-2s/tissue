import {Modal, ModalProps, Space, Tag} from "antd";
import {useNavigate} from "@tanstack/react-router";

interface Props extends ModalProps {
    actors: any
}

function ActorsModal(props: Props) {

    const {actors, ...otherProps} = props
    const navigate = useNavigate()

    return (
        <Modal {...otherProps} title={'演员'} footer={null} centered>
            <Space direction="vertical">
                {actors?.map((site: any) => (
                    <div>
                        <div className={'font-extrabold mb-2'}>{site.website}</div>
                        <Space wrap={true} size={[5, 10]}>
                            {site.items.map((actor: any) => (
                                <Tag className={'cursor-pointer'}>
                                    <a onClick={() => {
                                        if (!site.site_id) {
                                            return
                                        }
                                        navigate({
                                            to: '/actor', search: {site_id: site.site_id, code: actor.code}
                                        })
                                    }}>{actor.name}</a>
                                </Tag>
                            ))}
                        </Space>
                    </div>
                ))}
            </Space>
        </Modal>
    )
}

export default ActorsModal
