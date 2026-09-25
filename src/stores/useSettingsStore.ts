import { defineStore } from "pinia";
import { watch } from "vue";
import { useLocalStorage } from "@vueuse/core";
import type { OverscrollEffects, SystemBarAppearance } from "@bridgelauncher/api";
import { useTogglesStore } from "./useTogglesStore";
import { PAGE_COUNT, useWorkspaceStore } from "./useWorkspaceStore";

export type WallpaperKind = 'nexus' | 'system';
export type Level = 'low' | 'normal' | 'high';
export type NexusFps = 30 | 60 | 120;
export type StatusBarBackground = 'none' | 'gray' | 'blackGradient' | 'white' | 'black';

export const MAX_STATUS_BAR_HEIGHT = 80;

export const NEXUS_PULSES: Record<Level, number> = { low: 5, normal: 9, high: 15 };
export const NEXUS_SPEED: Record<Level, number> = { low: 0.6, normal: 1, high: 1.6 };

export const useSettingsStore = defineStore('settings', () =>
{
    const toggles = useTogglesStore();
    const workspace = useWorkspaceStore();

    const wallpaper = useLocalStorage<WallpaperKind>('settings.wallpaper', 'nexus');
    const nexusDensity = useLocalStorage<Level>('settings.nexusDensity', 'normal');
    const nexusSpeed = useLocalStorage<Level>('settings.nexusSpeed', 'normal');
    const nexusFps = useLocalStorage<NexusFps>('settings.nexusFps', 30);
    const statusBarBackground = useLocalStorage<StatusBarBackground>('settings.statusBarBackground', 'none');
    // -1 = automatic (measured), otherwise a fixed height in CSS px
    const statusBarHeight = useLocalStorage<number>('settings.statusBarHeight', -1);
    // draw our own Gingerbread status bar instead of the system one (hidden through Bridge)
    const gingerbreadStatusBar = useLocalStorage<boolean>('settings.gingerbreadStatusBar', false);
    // the Bridge status bar appearance to restore when turning the Gingerbread bar off
    const savedStatusBarAppearance = useLocalStorage<SystemBarAppearance>('settings.savedStatusBarAppearance', 'light-fg');
    // Gingerbread's orange glow at the end of lists, instead of Android's own overscroll effect
    const gingerbreadOverscroll = useLocalStorage<boolean>('settings.gingerbreadOverscroll', true);
    // Bridge's overscroll setting to restore when turning the Gingerbread glow off
    const savedOverscrollEffects = useLocalStorage<OverscrollEffects>('settings.savedOverscrollEffects', 'default');

    // Bridge only needs to draw the system wallpaper when the Nexus canvas isn't covering it
    watch(wallpaper, kind =>
    {
        const drawSystem = kind === 'system';
        if (toggles.drawSystemWallpaperBehindWebView !== drawSystem)
            toggles.drawSystemWallpaperBehindWebView = drawSystem;
    }, { immediate: true });

    // our Gingerbread bar replaces the system one: hide it while on, restore it when turned off.
    // On startup it only re-hides (if the Bridge setting was changed meanwhile), it never un-hides.
    watch(gingerbreadStatusBar, (on, wasOn) =>
    {
        if (on)
        {
            if (toggles.statusBarAppearance !== 'hide')
            {
                savedStatusBarAppearance.value = toggles.statusBarAppearance;
                toggles.statusBarAppearance = 'hide';
            }
        }
        else if (wasOn)
        {
            toggles.statusBarAppearance = savedStatusBarAppearance.value;
        }
    }, { immediate: true });

    // same idea for overscroll: turn off Bridge's effect while our glow is on, restore it when turned off
    watch(gingerbreadOverscroll, (on, wasOn) =>
    {
        if (on)
        {
            if (toggles.overscrollEffects !== 'none')
            {
                savedOverscrollEffects.value = toggles.overscrollEffects;
                toggles.overscrollEffects = 'none';
            }
        }
        else if (wasOn)
        {
            toggles.overscrollEffects = savedOverscrollEffects.value;
        }
    }, { immediate: true });

    // scroll the system wallpaper along with the pages, like a regular launcher
    Bridge.setWallpaperOffsetSteps(1 / (PAGE_COUNT - 1), 0);
    watch(() => workspace.scrollProgress, progress =>
    {
        if (wallpaper.value === 'system')
            Bridge.setWallpaperOffsets(progress, 0);
    }, { immediate: true });

    return {
        wallpaper,
        nexusDensity,
        nexusSpeed,
        nexusFps,
        statusBarBackground,
        statusBarHeight,
        gingerbreadStatusBar,
        gingerbreadOverscroll,
    };
});
