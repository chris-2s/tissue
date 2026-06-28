import type {ReactNode} from "react";
import React, {useEffect, useEffectEvent, useMemo, useRef, useState} from "react";
import {DownOutlined, LoadingOutlined} from "@ant-design/icons";
import Styles from "./index.module.css";
import {vibrateLight} from "../../utils/haptics.ts";
import {useTranslation} from "react-i18next";

const MAX_PULL_DISTANCE = 96;
const TRIGGER_DISTANCE = 72;
const DRAG_RATIO = 0.5;
const REFRESH_HOLD_DISTANCE = 56;
const INDICATOR_REVEAL_DISTANCE = 44;
const PULL_START_THRESHOLD = 18;
const TOP_TOLERANCE = 2;

interface Props {
    children?: ReactNode
    onRefresh?: (() => Promise<void> | void) | undefined
}

type PullPhase = "idle" | "pulling" | "ready" | "refreshing";

export default function Page({children, onRefresh}: Props) {
    const {t} = useTranslation(['common']);
    const pageRef = useRef<HTMLDivElement | null>(null);
    const indicatorRef = useRef<HTMLDivElement | null>(null);
    const contentRef = useRef<HTMLDivElement | null>(null);
    const [supportsPullToRefresh, setSupportsPullToRefresh] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [phase, setPhase] = useState<PullPhase>("idle");
    const startYRef = useRef<number | null>(null);
    const draggingRef = useRef(false);
    const pullDistanceRef = useRef(0);
    const phaseRef = useRef<PullPhase>("idle");
    const refreshingRef = useRef(false);
    const frameRef = useRef<number | null>(null);

    useEffect(() => {
        if (typeof window === "undefined") {
            return;
        }

        const mediaQuery = window.matchMedia("(pointer: coarse)");
        const syncSupport = () => {
            setSupportsPullToRefresh(mediaQuery.matches || navigator.maxTouchPoints > 0);
        };

        syncSupport();
        mediaQuery.addEventListener("change", syncSupport);

        return () => {
            mediaQuery.removeEventListener("change", syncSupport);
        };
    }, []);

    useEffect(() => {
        refreshingRef.current = refreshing;
    }, [refreshing]);

    const indicatorText = useMemo(() => {
        if (phase === "refreshing") {
            return t('common:pullToRefresh.refreshing');
        }

        if (phase === "ready") {
            return t('common:pullToRefresh.release');
        }

        if (phase === "pulling") {
            return t('common:pullToRefresh.pulling');
        }

        return "";
    }, [phase, t]);

    const indicatorIcon = useMemo(() => {
        if (phase === "refreshing") {
            return <LoadingOutlined className={Styles.iconSpinning}/>;
        }

        return (
            <DownOutlined
                className={`${Styles.icon} ${phase === "ready" ? Styles.iconReady : ""}`}
            />
        );
    }, [phase]);

    const enabled = Boolean(onRefresh) && supportsPullToRefresh;

    const applyPullStyles = useEffectEvent((distance: number, isDragging: boolean) => {
        const indicator = indicatorRef.current;
        const content = contentRef.current;

        if (!indicator || !content) {
            return;
        }

        const indicatorOffset = Math.min(distance, INDICATOR_REVEAL_DISTANCE) - INDICATOR_REVEAL_DISTANCE;
        const indicatorOpacity = Math.min(1, Math.max(0, distance) / INDICATOR_REVEAL_DISTANCE);

        if (frameRef.current !== null) {
            cancelAnimationFrame(frameRef.current);
        }

        frameRef.current = requestAnimationFrame(() => {
            indicator.style.opacity = `${indicatorOpacity}`;
            indicator.style.transform = `translateY(${indicatorOffset}px)`;
            content.style.transform = `translateY(${distance}px)`;

            if (isDragging) {
                content.classList.remove(Styles.contentAnimated);
            } else {
                content.classList.add(Styles.contentAnimated);
            }
        });
    });

    const updatePhase = useEffectEvent((nextPhase: PullPhase) => {
        if (phaseRef.current === nextPhase) {
            return;
        }

        if (nextPhase === "ready" && phaseRef.current !== "ready") {
            vibrateLight();
        }

        phaseRef.current = nextPhase;
        setPhase(nextPhase);
    });

    const runRefresh = useEffectEvent(async () => {
        if (!onRefresh) {
            return;
        }

        setRefreshing(true);
        updatePhase("refreshing");
        pullDistanceRef.current = REFRESH_HOLD_DISTANCE;
        applyPullStyles(REFRESH_HOLD_DISTANCE, false);

        try {
            await onRefresh();
        } finally {
            setRefreshing(false);
            pullDistanceRef.current = 0;
            updatePhase("idle");
            applyPullStyles(0, false);
        }
    });

    const resetPullState = useEffectEvent(() => {
        draggingRef.current = false;
        startYRef.current = null;
        pullDistanceRef.current = 0;
        if (!refreshingRef.current) {
            updatePhase("idle");
            applyPullStyles(0, false);
        }
    });

    function isScrollAtTop() {
        return window.scrollY <= TOP_TOLERANCE
            && document.documentElement.scrollTop <= TOP_TOLERANCE
            && document.body.scrollTop <= TOP_TOLERANCE;
    }

    const finishPull = useEffectEvent(async () => {
        if (!draggingRef.current) {
            return;
        }

        draggingRef.current = false;
        startYRef.current = null;

        if (pullDistanceRef.current >= TRIGGER_DISTANCE) {
            await runRefresh();
            return;
        }

        pullDistanceRef.current = 0;
        updatePhase("idle");
        applyPullStyles(0, false);
    });

    useEffect(() => {
        const page = pageRef.current;
        if (!page || !enabled) {
            return;
        }

        function handleTouchStart(event: TouchEvent) {
            if (refreshing || event.touches.length !== 1 || !isScrollAtTop()) {
                return;
            }

            draggingRef.current = true;
            startYRef.current = event.touches[0].clientY;
            applyPullStyles(pullDistanceRef.current, true);
        }

        function handleTouchMove(event: TouchEvent) {
            if (!draggingRef.current || startYRef.current === null || refreshing) {
                return;
            }

            const deltaY = event.touches[0].clientY - startYRef.current;
            if (deltaY <= 0) {
                pullDistanceRef.current = 0;
                updatePhase("idle");
                applyPullStyles(0, true);
                return;
            }

            if (!isScrollAtTop() && pullDistanceRef.current <= 0) {
                resetPullState();
                return;
            }

            if (deltaY < PULL_START_THRESHOLD) {
                pullDistanceRef.current = 0;
                updatePhase("idle");
                applyPullStyles(0, true);
                return;
            }

            event.preventDefault();
            const nextDistance = Math.min(MAX_PULL_DISTANCE, (deltaY - PULL_START_THRESHOLD) * DRAG_RATIO);
            pullDistanceRef.current = nextDistance;
            updatePhase(nextDistance >= TRIGGER_DISTANCE ? "ready" : "pulling");
            applyPullStyles(nextDistance, true);
        }

        function handleTouchCancel() {
            resetPullState();
        }

        function onTouchEnd() {
            void finishPull();
        }

        page.addEventListener("touchstart", handleTouchStart, {passive: true});
        page.addEventListener("touchmove", handleTouchMove, {passive: false});
        page.addEventListener("touchend", onTouchEnd, {passive: true});
        page.addEventListener("touchcancel", handleTouchCancel, {passive: true});

        return () => {
            page.removeEventListener("touchstart", handleTouchStart);
            page.removeEventListener("touchmove", handleTouchMove);
            page.removeEventListener("touchend", onTouchEnd);
            page.removeEventListener("touchcancel", handleTouchCancel);
        };
    }, [applyPullStyles, enabled, finishPull, refreshing, resetPullState, updatePhase]);

    useEffect(() => {
        return () => {
            if (frameRef.current !== null) {
                cancelAnimationFrame(frameRef.current);
            }
        };
    }, []);

    if (!enabled) {
        return <>{children}</>;
    }

    return (
        <div ref={pageRef} className={Styles.page}>
            <div ref={indicatorRef} className={Styles.indicator}>
                <div
                    className={`${Styles.indicatorInner} ${phase === "idle" ? Styles.indicatorInnerHidden : ""}`}
                    aria-hidden={phase === "idle"}
                >
                    <span className={Styles.iconWrap} aria-hidden={phase === "idle"}>
                        {indicatorIcon}
                    </span>
                    <span>{indicatorText || t('common:pullToRefresh.pulling')}</span>
                </div>
            </div>
            <div ref={contentRef} className={`${Styles.content} ${Styles.contentAnimated}`}>
                {children}
            </div>
        </div>
    );
}
