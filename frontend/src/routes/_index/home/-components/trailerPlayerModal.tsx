import {Alert, Modal, Spin} from "antd";
import React, {useEffect, useRef, useState} from "react";
import Hls from "hls.js";
import * as api from "../../../../apis/video.ts";
import type {VideoPreviewItem} from "../../../../types/video";

interface Props {
    open: boolean;
    item?: VideoPreviewItem;
    onClose: () => void;
}

function isHlsUrl(url: string) {
    return url.toLowerCase().includes(".m3u8");
}

function canUseNativeHls(video: HTMLVideoElement) {
    return video.canPlayType("application/vnd.apple.mpegurl") === "probably";
}

function TrailerPlayerModal(props: Props) {
    const {open, item, onClose} = props;
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const hlsRef = useRef<Hls | null>(null);
    const [modalReady, setModalReady] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>();

    useEffect(() => {
        const video = videoRef.current;
        const sourceUrl = item?.url;

        if (!open || !modalReady || !video || !sourceUrl) {
            return;
        }

        const currentVideo = video;
        const trailerUrl = api.getVideoTrailer(sourceUrl);
        const isHls = isHlsUrl(sourceUrl);

        function cleanupPlayer() {
            hlsRef.current?.destroy();
            hlsRef.current = null;
            currentVideo.pause();
            currentVideo.removeAttribute("src");
            currentVideo.load();
        }

        function handleLoaded() {
            setLoading(false);
            setError(undefined);
        }

        function handleError() {
            setLoading(false);
            setError("预告片加载失败，请稍后重试");
        }

        cleanupPlayer();
        setLoading(true);
        setError(undefined);
        currentVideo.addEventListener("loadedmetadata", handleLoaded);
        currentVideo.addEventListener("error", handleError);

        if (!isHls) {
            currentVideo.src = trailerUrl;
            void currentVideo.play().catch(() => undefined);
        } else if (Hls.isSupported()) {
            const hls = new Hls();
            hlsRef.current = hls;
            hls.loadSource(trailerUrl);
            hls.attachMedia(currentVideo);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                setLoading(false);
                void currentVideo.play().catch(() => undefined);
            });
            hls.on(Hls.Events.ERROR, (_, data) => {
                if (!data.fatal) {
                    return;
                }
                setLoading(false);
                setError("当前浏览器无法播放该 HLS 预告片");
            });
        } else if (canUseNativeHls(currentVideo)) {
            currentVideo.src = trailerUrl;
            void currentVideo.play().catch(() => undefined);
        } else {
            setLoading(false);
            setError("当前浏览器不支持该视频格式");
        }

        return () => {
            currentVideo.removeEventListener("loadedmetadata", handleLoaded);
            currentVideo.removeEventListener("error", handleError);
            cleanupPlayer();
        };
    }, [item?.url, modalReady, open]);

    return (
        <Modal
            open={open}
            onCancel={onClose}
            afterOpenChange={setModalReady}
            title={"预告片"}
            footer={null}
            centered
            destroyOnClose
            width={"min(960px, calc(100vw - 32px))"}
            styles={{
                body: {
                    padding: 0,
                    backgroundColor: "#000",
                }
            }}
        >
            <div className={"relative bg-black"}>
                {loading && (
                    <div className={"absolute inset-0 z-10 flex items-center justify-center bg-black/45"}>
                        <Spin size={"large"}/>
                    </div>
                )}
                <video
                    ref={videoRef}
                    controls
                    autoPlay
                    muted
                    playsInline
                    preload={"metadata"}
                    poster={item?.thumb ? api.getImageUrl(item.thumb, "preview") : undefined}
                    className={"block max-h-[80vh] min-h-[240px] w-full bg-black"}
                />
                {error && (
                    <div className={"p-4"}>
                        <Alert message={error} type={"error"} showIcon/>
                    </div>
                )}
            </div>
        </Modal>
    );
}

export default TrailerPlayerModal;
