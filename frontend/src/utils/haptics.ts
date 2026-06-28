export function vibrate(pattern: number | number[]) {
    if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') {
        return false;
    }

    try {
        return navigator.vibrate(pattern);
    } catch {
        return false;
    }
}

export function vibrateLight() {
    return vibrate(12);
}

export function vibrateError() {
    return vibrate([18, 24, 18]);
}
