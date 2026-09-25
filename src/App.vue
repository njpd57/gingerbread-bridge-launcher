<script setup lang="ts">
import { ref } from 'vue';
import { useWindowInsetsStore } from '@/stores/useWindowInsetsStore';
import { useMenuStore } from '@/stores/useMenuStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { px } from './utils/el-utils';
import Workspace from './home/Workspace.vue';
import Dock from './home/Dock.vue';
import AppDrawer from './drawer/AppDrawer.vue';
import AnalogClock from './widgets/clock/AnalogClock.vue';
import WeatherWidget from './widgets/weather/WeatherWidget.vue';
import { DEFAULT_PAGE } from './stores/useWorkspaceStore';
import NexusWallpaper from './wallpaper/NexusWallpaper.vue';
import OptionsMenu from './menu/OptionsMenu.vue';
import WallpaperDialog from './menu/WallpaperDialog.vue';

const LONG_PRESS_MS = 500;
const LONG_PRESS_SLOP_PX = 10;

const insets = useWindowInsetsStore();
const menu = useMenuStore();
const settings = useSettingsStore();

const wallpaper = ref<InstanceType<typeof NexusWallpaper>>();

// only taps on empty workspace space count, not taps on widgets
function isEmptySpace(target: EventTarget | null)
{
    return target instanceof HTMLElement && target.classList.contains('page');
}

let pressTimer = 0;
let pressX = 0;
let pressY = 0;
let suppressNextClick = false;

function cancelLongPress()
{
    clearTimeout(pressTimer);
    pressTimer = 0;
}

function onPointerDown(e: PointerEvent)
{
    suppressNextClick = false;
    if (!isEmptySpace(e.target)) return;

    pressX = e.clientX;
    pressY = e.clientY;
    cancelLongPress();
    pressTimer = window.setTimeout(() =>
    {
        pressTimer = 0;
        suppressNextClick = true;
        try { navigator.vibrate?.(30); } catch { /* no vibration permission */ }
        menu.showOptionsMenu();
    }, LONG_PRESS_MS);
}

function onPointerMove(e: PointerEvent)
{
    if (pressTimer && Math.hypot(e.clientX - pressX, e.clientY - pressY) > LONG_PRESS_SLOP_PX)
        cancelLongPress();
}

// a tap on empty space sends pulses across the Nexus wallpaper
function onWorkspaceClick(e: MouseEvent)
{
    if (suppressNextClick)
    {
        suppressNextClick = false;
        return;
    }
    if (isEmptySpace(e.target))
        wallpaper.value?.burst(e.clientX, e.clientY);
}

</script>

<template>
    <div class="launcher-root" :class="{ 'system-wallpaper': settings.wallpaper === 'system' }">

        <NexusWallpaper v-if="settings.wallpaper === 'nexus'" ref="wallpaper" />

        <Workspace
            class="workspace"
            @pointerdown="onPointerDown"
            @pointermove="onPointerMove"
            @pointerup="cancelLongPress"
            @pointercancel="cancelLongPress"
            @pointerleave="cancelLongPress"
            @contextmenu.prevent
            @click="onWorkspaceClick"
            :style="{
                'padding-top': px(insets.statusBars.top),
            }">
            <template #default="{ page }">
                <div v-if="page === DEFAULT_PAGE" class="widgets">
                    <AnalogClock class="clock" />
                    <WeatherWidget />
                </div>
            </template>
        </Workspace>

        <Dock
            class="dock"
            :style="{
                'bottom': px(insets.navigationBars.bottom),
            }" />

        <AppDrawer />

        <OptionsMenu />
        <WallpaperDialog />

    </div>
</template>

<style scoped lang="scss">
.launcher-root {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background-color: #000;

    // let Bridge's system wallpaper show through
    &.system-wallpaper {
        background-color: transparent;
    }

    > .workspace {
        position: relative;
    }

    .widgets {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 20px;
        padding: 24px 12px 0;

        > .clock {
            width: min(55vw, 220px);
        }

        > :not(.clock) {
            align-self: stretch;
        }
    }

    > .dock {
        position: absolute;
        left: 0;
        right: 0;
    }
}
</style>
