import type {ReactNode, TouchEvent} from "react";
import React, {useEffect, useEffectEvent, useMemo, useRef, useState} from "react";
import Styles from "./index.module.css";

const MAX_PULL_DISTANCE = 96;
const TRIGGER_DISTANCE = 72;
const DRAG_RATIO = 0.5;
const REFRESH_HOLD_DISTANCE = 56;
const INDICATOR_REVEAL_DISTANCE = 44;

interface Props {
    children?: ReactNode
    onRefresh?: (() => Promise<void> | void) | undefined
}

export default function Page({children, onRefresh}: Props) {
    const [supportsPullToRefresh, setSupportsPullToRefresh] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);
    const [refreshing, setRefreshing] = useState(false);
    const startYRef = useRef<number | null>(null);
    const draggingRef = useRef(false);

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

    const enabled = Boolean(onRefresh) && supportsPullToRefresh;
    const ready = pullDistance >= TRIGGER_DISTANCE;
    const contentOffset = refreshing ? REFRESH_HOLD_DISTANCE : pullDistance;
    const indicatorVisible = refreshing || pullDistance > 0;
    const indicatorOffset = Math.min(contentOffset, INDICATOR_REVEAL_DISTANCE) - INDICATOR_REVEAL_DISTANCE;
    const indicatorOpacity = Math.min(1, contentOffset / INDICATOR_REVEAL_DISTANCE);

    const indicatorText = useMemo(() => {
        if (refreshing) {
            return "刷新中...";
        }

        if (ready) {
            return "松开刷新";
        }

        if (pullDistance > 0) {
            return "下拉刷新";
        }

        return "";
    }, [pullDistance, ready, refreshing]);

    const runRefresh = useEffectEvent(async () => {
        if (!onRefresh) {
            return;
        }

        setRefreshing(true);
        setPullDistance(REFRESH_HOLD_DISTANCE);

        try {
            await onRefresh();
        } finally {
            setRefreshing(false);
            setPullDistance(0);
        }
    });

    function resetPullState() {
        draggingRef.current = false;
        startYRef.current = null;
        if (!refreshing) {
            setPullDistance(0);
        }
    }

    function isScrollAtTop() {
        return window.scrollY <= 0
            && document.documentElement.scrollTop <= 0
            && document.body.scrollTop <= 0;
    }

    function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
        if (!enabled || refreshing || event.touches.length !== 1 || !isScrollAtTop()) {
            return;
        }

        draggingRef.current = true;
        startYRef.current = event.touches[0].clientY;
    }

    function handleTouchMove(event: TouchEvent<HTMLDivElement>) {
        if (!draggingRef.current || startYRef.current === null || refreshing) {
            return;
        }

        const deltaY = event.touches[0].clientY - startYRef.current;
        if (deltaY <= 0) {
            setPullDistance(0);
            return;
        }

        if (!isScrollAtTop()) {
            resetPullState();
            return;
        }

        event.preventDefault();
        setPullDistance(Math.min(MAX_PULL_DISTANCE, deltaY * DRAG_RATIO));
    }

    async function handleTouchEnd() {
        if (!draggingRef.current) {
            return;
        }

        draggingRef.current = false;
        startYRef.current = null;

        if (ready) {
            await runRefresh();
            return;
        }

        setPullDistance(0);
    }

    if (!enabled) {
        return <>{children}</>;
    }

    return (
        <div
            className={Styles.page}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={() => void handleTouchEnd()}
            onTouchCancel={resetPullState}
        >
            <div
                className={Styles.indicator}
                style={{
                    opacity: indicatorOpacity,
                    transform: `translateY(${indicatorOffset}px)`,
                }}
            >
                {indicatorVisible && indicatorText && (
                    <div className={Styles.indicatorInner}>
                        {refreshing && <span className={Styles.spinner}/>}
                        <span>{indicatorText}</span>
                    </div>
                )}
            </div>
            <div
                className={`${Styles.content} ${!draggingRef.current ? Styles.contentAnimated : ""}`}
                style={{transform: `translateY(${contentOffset}px)`}}
            >
                {children}
            </div>
        </div>
    );
}
