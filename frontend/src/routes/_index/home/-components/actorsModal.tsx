import {Empty, Modal, ModalProps} from "antd";
import {useNavigate} from "@tanstack/react-router";
import RemoteImage from "../../../../components/RemoteImage";
import {IMAGE_TYPES} from "../../../../constants/image";
import type {VideoSiteActor} from "../../../../types/video";

interface Props extends ModalProps {
    actors: VideoSiteActor[]
}

function ActorsModal(props: Props) {
    const {actors, ...otherProps} = props;
    const navigate = useNavigate();

    return (
        <Modal {...otherProps} title={'演员'} footer={null} centered width={920}>
            <div className={'max-h-[70vh] overflow-y-auto pr-1'}>
                {actors?.length ? (
                    <div className={'space-y-4'}>
                        {actors.map((site) => (
                            <section key={site.source.site_id} className={'rounded-lg bg-[var(--ant-color-fill-quaternary)] px-3 py-3'}>
                                <div className={'mb-2 text-sm font-extrabold'}>{site.source.site_name}</div>
                                <div className={'grid grid-cols-3 gap-2 md:grid-cols-4 lg:grid-cols-5'}>
                                    {site.items.map((actor) => (
                                        <button
                                            type={'button'}
                                            key={`${site.source.site_id}-${actor.code}`}
                                            className={'flex min-h-[108px] cursor-pointer items-center justify-center rounded-lg bg-[var(--ant-color-bg-container)] px-2 py-2 text-center transition-all hover:-translate-y-0.5 hover:shadow-sm'}
                                            onClick={() => {
                                                navigate({
                                                    to: '/actor',
                                                    search: {site_id: site.source.site_id, code: actor.code}
                                                });
                                            }}
                                        >
                                            <div className={'flex flex-col items-center justify-center'}>
                                                <div className={'mb-1.5 h-14 w-14'}>
                                                    <RemoteImage
                                                        className={'h-full w-full'}
                                                        src={actor.thumb}
                                                        num={actor.code}
                                                        avatar
                                                        imageType={IMAGE_TYPES.AVATAR}
                                                    />
                                                </div>
                                                <div className={'flex items-center justify-center text-xs font-medium leading-4'}>
                                                    <span className={'line-clamp-2'}>{actor.name || '未知演员'}</span>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>
                ) : (
                    <Empty description={'暂无演员信息'}/>
                )}
            </div>
        </Modal>
    );
}

export default ActorsModal;
