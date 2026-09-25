import type { BridgeEventListener, WindowInsets } from "@bridgelauncher/api";
import { defineStore } from "pinia";
import { computed, reactive } from "vue";
import { useBridgeEventStore } from "./useBridgeEventStore";
import { useTogglesStore } from "./useTogglesStore";
import { useSettingsStore } from "./useSettingsStore";

// used when the status bar is shown but every inset Bridge reports is 0
export const FALLBACK_STATUS_BAR_HEIGHT = 32;

// re-read the insets a little after startup, in case Bridge reported them before the first layout
const STARTUP_REFRESH_DELAYS_MS = [300, 1500];

const ZERO: WindowInsets = { left: 0, top: 0, right: 0, bottom: 0 };

/** Accepts the insets as Bridge's JSON string or as an already-parsed object; anything invalid becomes zeros. */
export function toInsets(value: unknown): WindowInsets
{
    try
    {
        const o = typeof value === 'string' ? JSON.parse(value) : value;
        if (!o || typeof o !== 'object') return ZERO;
        const n = (v: unknown) => typeof v === 'number' && isFinite(v) && v > 0 ? v : 0;
        const r = o as Record<string, unknown>;
        return { left: n(r.left), top: n(r.top), right: n(r.right), bottom: n(r.bottom) };
    }
    catch
    {
        return ZERO;
    }
}

const SOURCES = {
    statusBars: () => Bridge.getStatusBarsWindowInsets(),
    statusBarsIgnoringVisibility: () => Bridge.getStatusBarsIgnoringVisibilityWindowInsets(),
    navigationBars: () => Bridge.getNavigationBarsWindowInsets(),
    navigationBarsIgnoringVisibility: () => Bridge.getNavigationBarsIgnoringVisibilityWindowInsets(),
    systemBars: () => Bridge.getSystemBarsWindowInsets(),
    displayCutout: () => Bridge.getDisplayCutoutWindowInsets(),
};

type InsetsName = keyof typeof SOURCES;

const EVENTS: Record<string, InsetsName> = {
    statusBarsWindowInsetsChanged: 'statusBars',
    statusBarsIgnoringVisibilityWindowInsetsChanged: 'statusBarsIgnoringVisibility',
    navigationBarsWindowInsetsChanged: 'navigationBars',
    navigationBarsIgnoringVisibilityWindowInsetsChanged: 'navigationBarsIgnoringVisibility',
    systemBarsWindowInsetsChanged: 'systemBars',
    displayCutoutWindowInsetsChanged: 'displayCutout',
};

export const useWindowInsetsStore = defineStore('windowInsets', () =>
{
    const bridgeEvents = useBridgeEventStore();
    const toggles = useTogglesStore();
    const settings = useSettingsStore();

    const insets = reactive({} as Record<InsetsName, WindowInsets>);

    function refresh()
    {
        for (const name of Object.keys(SOURCES) as InsetsName[])
        {
            try { insets[name] = toInsets(SOURCES[name]()); }
            catch { insets[name] = ZERO; }
        }
    }

    refresh();
    for (const delay of STARTUP_REFRESH_DELAYS_MS)
        setTimeout(refresh, delay);
    window.addEventListener('resize', refresh);

    const onBridgeEvent: BridgeEventListener = ev =>
    {
        if (ev.name === 'afterResume')
        {
            refresh();
            return;
        }
        const name = EVENTS[ev.name];
        if (name && 'newValue' in ev)
            insets[name] = toInsets(ev.newValue);
    };
    bridgeEvents.addEventListener(onBridgeEvent);

    const isStatusBarHeightManual = computed(() => settings.statusBarHeight >= 0);

    /** The status bar height as detected from Bridge (with a fallback), ignoring the manual setting. */
    const measuredStatusBarHeight = computed(() =>
    {
        if (toggles.statusBarAppearance === 'hide') return 0;
        const measured = Math.max(
            insets.statusBars.top,
            insets.statusBarsIgnoringVisibility.top,
            insets.systemBars.top,
            insets.displayCutout.top,
        );
        return measured > 0 ? measured : FALLBACK_STATUS_BAR_HEIGHT;
    });

    /** Space to leave at the top for the status bar, in CSS px: the manual height if set, otherwise the measured one. */
    const statusBarHeight = computed(() =>
        isStatusBarHeightManual.value ? settings.statusBarHeight : measuredStatusBarHeight.value);

    /** Space to leave at the bottom for the navigation bar (0 with hidden gesture navigation), in CSS px. */
    const navigationBarHeight = computed(() =>
    {
        if (toggles.navigationBarAppearance === 'hide') return 0;
        return Math.max(
            insets.navigationBars.bottom,
            insets.navigationBarsIgnoringVisibility.bottom,
            insets.systemBars.bottom,
        );
    });

    // CSS values that also honour the WebView's own safe area, whichever is larger
    const statusBarCss = computed(() =>
    {
        if (isStatusBarHeightManual.value || statusBarHeight.value === 0)
            return `${statusBarHeight.value}px`;
        return `max(${statusBarHeight.value}px, env(safe-area-inset-top, 0px))`;
    });

    const navigationBarCss = computed(() => toggles.navigationBarAppearance === 'hide'
        ? '0px'
        : `max(${navigationBarHeight.value}px, env(safe-area-inset-bottom, 0px))`);

    return {
        insets,
        measuredStatusBarHeight,
        statusBarHeight,
        navigationBarHeight,
        statusBarCss,
        navigationBarCss,
        refresh,
    };
});
