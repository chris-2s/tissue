import {Modal, ModalProps, Space, Tag} from "antd";
import {useNavigate} from "@tanstack/react-router";
import type {VideoSiteActor} from "../../../../types/video";

interface Props extends ModalProps {
    actors: VideoSiteActor[]
}

function ActorsModal(props: Props) {

    const {actors, ...otherProps} = props
    const navigate = useNavigate()

    return (
        <Modal {...otherProps} title={'演员'} footer={null} centered>
            <Space direction="vertical">
                {actors?.map((site) => (
                    <div>
                        <div className={'font-extrabold mb-2'}>{site.source.site_name}</div>
                        <Space wrap={true} size={[5, 10]}>
                            {site.items.map((actor) => (
                                <Tag className={'cursor-pointer'}>
                                    <a onClick={() => {
                                        if (!site.source?.site_id) {
                                            return
                                        }
                                        navigate({
                                            to: '/actor', search: {site_id: site.source.site_id, code: actor.code}
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
