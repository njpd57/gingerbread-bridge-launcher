export const LONG_PRESS_MS = 500;
export const LONG_PRESS_SLOP_PX = 10;

export interface PointerPosition
{
    x: number;
    y: number;
}

/**
 * Detects a long press. One instance can be shared by many elements (e.g. a v-for list),
 * since only one press is tracked at a time: pass the pressed element's payload to `down()`.
 */
export function useLongPress<T>(onLongPress: (payload: T, position: PointerPosition) => void)
{
    let timer = 0;
    let startX = 0;
    let startY = 0;
    let lastX = 0;
    let lastY = 0;
    let fired = false;

    function cancel()
    {
        clearTimeout(timer);
        timer = 0;
    }

    function down(payload: T, e: PointerEvent)
    {
        fired = false;
        cancel();
        if (e.pointerType === 'mouse' && e.button !== 0) return;

        startX = lastX = e.clientX;
        startY = lastY = e.clientY;
        timer = window.setTimeout(() =>
        {
            timer = 0;
            fired = true;
            try { navigator.vibrate?.(30); } catch { /* no vibration permission */ }
            onLongPress(payload, { x: lastX, y: lastY });
        }, LONG_PRESS_MS);
    }

    function move(e: PointerEvent)
    {
        lastX = e.clientX;
        lastY = e.clientY;
        if (timer && Math.hypot(lastX - startX, lastY - startY) > LONG_PRESS_SLOP_PX)
            cancel();
    }

    /** Call from a click handler: returns true (once) if that click ended a long press and should be ignored. */
    function consumeLongPress()
    {
        const f = fired;
        fired = false;
        return f;
    }

    return {
        down,
        move,
        cancel,
        consumeLongPress,
    };
}
