import {Col, Row} from "antd";
import PreviewImage from "./previewImage.tsx";
import React, {useState} from "react";
import Lightbox from "yet-another-react-lightbox";
import * as api from "../../../../apis/video.ts";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/counter.css";
import {Counter, Zoom} from "yet-another-react-lightbox/plugins";
import type {VideoPreviewItem} from "../../../../types/video";
import {IMAGE_TYPES} from "../../../../constants/image";
import TrailerPlayerModal from "./trailerPlayerModal.tsx";

function Preview(props: { data: VideoPreviewItem[] }) {
    const {data} = props;
    const [openPreview, setOpenPreview] = useState(false);
    const [previewIndex, setPreviewIndex] = useState(0);
    const [videoPreview, setVideoPreview] = useState<VideoPreviewItem>();

    const imageSlides = data
        .filter((item) => item.type !== "video")
        .map((item) => ({
            src: api.getImageUrl(item.url || "", IMAGE_TYPES.PREVIEW)
        }));

    const imagePreviewIndexes = new Map<number, number>();
    let imageIndex = 0;
    data.forEach((item, index) => {
        if (item.type === "video") {
            return;
        }
        imagePreviewIndexes.set(index, imageIndex);
        imageIndex += 1;
    });

    return (
        <Row gutter={[10, 10]}>
            {data.map((item, index: number) => (
                <Col className={'cursor-pointer flex items-center'} span={8} lg={3} md={6} key={item.url}
                     onClick={() => {
                         if (item.type === "video") {
                             setVideoPreview(item);
                             return;
                         }

                         setPreviewIndex(imagePreviewIndexes.get(index) || 0);
                         setOpenPreview(true);
                     }}>
                    <PreviewImage src={item.thumb || ''} type={item.type || 'image'}/>
                </Col>
            ))}
            <Lightbox
                open={openPreview}
                index={previewIndex}
                close={() => setOpenPreview(false)}
                plugins={[Counter, Zoom]}
                controller={{
                    closeOnPullDown: true
                }}
                slides={imageSlides}
            />
            <TrailerPlayerModal
                open={!!videoPreview}
                item={videoPreview}
                onClose={() => setVideoPreview(undefined)}
            />
        </Row>
    );
}

export default Preview;
