import {Col, Row} from "antd";
import PreviewImage from "./previewImage.tsx";
import React, {useState} from "react";
import Lightbox from "yet-another-react-lightbox";
import * as api from "../../../../apis/video.ts";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/counter.css";
import {Counter, Zoom} from "yet-another-react-lightbox/plugins";
import Video from "yet-another-react-lightbox/plugins/video";
import type {VideoPreviewItem} from "../../../../types/video";

function Preview(props: { data: VideoPreviewItem[] }) {
    const {data} = props
    const [openPreview, setOpenPreview] = useState(false);
    const [previewIndex, setPreviewIndex] = useState(0);

    const slides = data.map((item) => (
        item.type === "video" ? (
            {
                type: "video" as const,
                poster: api.getVideoCover(item.thumb || ''),
                sources: [
                    {
                        src: api.getVideoTrailer(item.url || ''),
                        type: 'video/mp4',
                    },
                ],
            }
        ) : (
            {
                src: api.getVideoCover(item.url || '')
            }
        )
    ))

    return (
        <Row gutter={[10, 10]}>
            {data.map((i, index: number) => (
                <Col className={'cursor-pointer flex items-center'} span={8} lg={3} md={6} key={i.url}
                     onClick={() => {
                         setPreviewIndex(index)
                         setOpenPreview(true)
                     }}>
                    <PreviewImage src={i.thumb || ''} type={i.type || 'image'}/>
                </Col>
            ))}
            <Lightbox open={openPreview}
                      index={previewIndex}
                      close={() => setOpenPreview(false)}
                      plugins={[Counter, Video, Zoom]}
                      video={{
                          muted: true,
                          playsInline: false
                      }}
                      controller={{
                          closeOnPullDown: true
                      }}
                      slides={slides}/>
        </Row>
    )
}

export default Preview
