import { onBeforeUnmount, ref, watch, type Ref } from "vue";
import type { EffectiveConnectionType } from "./useDeviceStatus";

// how long a signal level stays before drifting, and how often data activity flickers
const DRIFT_MIN_MS = 15_000;
const DRIFT_MAX_MS = 45_000;
const ACTIVITY_MIN_MS = 800;
const ACTIVITY_MAX_MS = 3_000;

const rand = (min: number, max: number) => min + Math.random() * (max - min);

/** The range the fake signal wanders in, narrowed by the browser's connection quality estimate when there is one. */
function levelRange(max: number, effectiveType: EffectiveConnectionType | null): [number, number]
{
    switch (effectiveType)
    {
        case 'slow-2g': return [1, 1];
        case '2g': return [1, Math.min(2, max)];
        case '3g': return [Math.max(1, max - 2), max - 1];
        default: return [Math.max(1, max - 1), max]; // '4g' or unknown: good signal
    }
}

/**
 * A believable, slowly drifting signal level (1..max) plus data activity arrows,
 * since Android's real signal strength isn't available to the WebView.
 */
export function useSimulatedSignal(max: number, online: Ref<boolean>, effectiveType: Ref<EffectiveConnectionType | null>)
{
    const level = ref(max);
    const activityIn = ref(false);
    const activityOut = ref(false);

    let driftTimer = 0;
    let activityTimer = 0;

    function clampToRange()
    {
        const [lo, hi] = levelRange(max, effectiveType.value);
        level.value = Math.max(lo, Math.min(hi, level.value));
    }

    // step one bar up or down (or stay), never jumping
    function drift()
    {
        const [lo, hi] = levelRange(max, effectiveType.value);
        const step = Math.floor(Math.random() * 3) - 1;
        level.value = Math.max(lo, Math.min(hi, level.value + step));
        driftTimer = window.setTimeout(drift, rand(DRIFT_MIN_MS, DRIFT_MAX_MS));
    }

    // mostly idle, with occasional bursts of download and less often upload
    function flicker()
    {
        const r = Math.random();
        activityIn.value = online.value && r < 0.35;
        activityOut.value = online.value && r > 0.2 && r < 0.45;
        activityTimer = window.setTimeout(flicker, rand(ACTIVITY_MIN_MS, ACTIVITY_MAX_MS));
    }

    clampToRange();
    driftTimer = window.setTimeout(drift, rand(DRIFT_MIN_MS, DRIFT_MAX_MS));
    flicker();

    watch(effectiveType, clampToRange);

    onBeforeUnmount(() =>
    {
        clearTimeout(driftTimer);
        clearTimeout(activityTimer);
    });

    return {
        level,
        activityIn,
        activityOut,
    };
}
