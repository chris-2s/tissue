import {Modal, Slider} from "antd";
import React, {useEffect, useMemo, useRef, useState} from "react";
import Cropper from "react-easy-crop";
import type {Area, Point} from "react-easy-crop";
import {useTranslation} from "react-i18next";

import * as api from "../../apis/video";
import type {PosterCrop} from "../../types/video";
import Styles from "./posterCropModal.module.css";

const POSTER_ASPECT_RATIO = 379 / 538;
const PREVIEW_WIDTH = 379;
const PREVIEW_HEIGHT = 538;

interface ImageSize {
    width: number
    height: number
}

interface Props {
    cover?: string
    value?: PosterCrop
    open: boolean
    onCancel: () => void
    onApply: (crop: PosterCrop) => void
}

function getRightCrop(size: ImageSize): Area {
    const imageAspectRatio = size.width / size.height

    if (imageAspectRatio >= POSTER_ASPECT_RATIO) {
        const width = POSTER_ASPECT_RATIO / imageAspectRatio * 100
        return {x: 100 - width, y: 0, width, height: 100}
    }

    const height = imageAspectRatio / POSTER_ASPECT_RATIO * 100
    return {x: 0, y: (100 - height) / 2, width: 100, height}
}

function PosterCropModal({cover, value, open, onCancel, onApply}: Props) {
    const {t} = useTranslation(['video'])
    const imageRef = useRef<HTMLImageElement | null>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [modalReady, setModalReady] = useState(false)
    const [initialCrop, setInitialCrop] = useState<Area>()
    const [selectedCrop, setSelectedCrop] = useState<PosterCrop>()
    const [crop, setCrop] = useState<Point>({x: 0, y: 0})
    const [zoom, setZoom] = useState(1)
    const [loadFailed, setLoadFailed] = useState(false)

    const source = useMemo(
        () => cover ? `${api.getImageUrl(cover, 'cover')}&canvas=1` : undefined,
        [cover],
    )

    useEffect(() => {
        if (!open || !source) return

        setInitialCrop(undefined)
        setCrop({x: 0, y: 0})
        setZoom(1)
        setLoadFailed(false)
        setSelectedCrop(undefined)

        const image = new Image()
        image.crossOrigin = 'anonymous'
        image.onload = () => {
            imageRef.current = image
            setInitialCrop(value ?? getRightCrop({width: image.naturalWidth, height: image.naturalHeight}))
        }
        image.onerror = () => setLoadFailed(true)
        image.src = source

        return () => {
            image.onload = null
            image.onerror = null
        }
    }, [open, source, value])

    useEffect(() => {
        if (!open) setModalReady(false)
    }, [open])

    function drawPreview(area: Area) {
        const image = imageRef.current
        const canvas = canvasRef.current
        if (!image || !canvas) return

        const context = canvas.getContext('2d')
        if (!context) return
        context.clearRect(0, 0, PREVIEW_WIDTH, PREVIEW_HEIGHT)
        context.drawImage(
            image,
            area.x,
            area.y,
            area.width,
            area.height,
            0,
            0,
            PREVIEW_WIDTH,
            PREVIEW_HEIGHT,
        )
    }

    function handleCropAreaChange(croppedArea: Area, croppedAreaPixels: Area) {
        setSelectedCrop(croppedArea)
        drawPreview(croppedAreaPixels)
    }

    function handleApply() {
        if (selectedCrop) onApply(selectedCrop)
    }

    const cropperReady = Boolean(modalReady && initialCrop && source && !loadFailed)

    return (
        <Modal
            title={t('video:detail.image.cropTitle')}
            open={open}
            width={880}
            onCancel={onCancel}
            onOk={handleApply}
            okButtonProps={{disabled: !selectedCrop || loadFailed}}
            afterOpenChange={setModalReady}
        >
            <div className={Styles.workspace}>
                <div>
                    <div className={Styles.stage}>
                        {cropperReady && (
                            <Cropper
                                image={source}
                                crop={crop}
                                zoom={zoom}
                                aspect={POSTER_ASPECT_RATIO}
                                objectFit="contain"
                                restrictPosition
                                showGrid
                                roundCropAreaPixels
                                zoomWithScroll={false}
                                initialCroppedAreaPercentages={initialCrop}
                                onCropChange={setCrop}
                                onZoomChange={setZoom}
                                onCropAreaChange={handleCropAreaChange}
                                classes={{
                                    containerClassName: Styles.cropper,
                                    cropAreaClassName: Styles.cropArea,
                                }}
                                mediaProps={{crossOrigin: 'anonymous'}}
                            />
                        )}
                        {loadFailed && (
                            <div className={Styles.error}>{t('video:detail.image.loadFailed')}</div>
                        )}
                    </div>
                    <div className={Styles.zoomControl}>
                        <span>{t('video:detail.image.zoom')}</span>
                        <Slider
                            min={1}
                            max={2.5}
                            step={0.05}
                            value={zoom}
                            disabled={!cropperReady}
                            onChange={setZoom}
                        />
                    </div>
                </div>
                <aside className={Styles.previewPanel}>
                    <span className={Styles.previewLabel}>{t('video:detail.image.posterPreview')}</span>
                    <canvas
                        ref={canvasRef}
                        className={Styles.preview}
                        width={PREVIEW_WIDTH}
                        height={PREVIEW_HEIGHT}
                    />
                </aside>
            </div>
        </Modal>
    )
}

export default PosterCropModal
